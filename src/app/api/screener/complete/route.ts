import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  finalizeScreener,
  getScreenerRepo,
} from '@contexts/screener/server'
import { inngest } from '@shared/infra/inngest/client'
import { getErrorTracker, getLogger } from '@shared/infra/observability'
import type { ScreenerAnswers } from '@contexts/screener'

/**
 * POST /api/screener/complete
 *
 * Body: { answers: ScreenerAnswers, sessionId?: string }
 *
 * Persists the screener session, creates a lead row when an email
 * was captured, and queues the magic-link results email. Returns the
 * computed result + the magic-link URL.
 *
 * Cloudflare Turnstile gating is wired via TURNSTILE_SECRET when
 * present (no-op otherwise so dev runs without it). TODO(human-action):
 * provision the Turnstile site, add the env, set TURNSTILE_SECRET +
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 */

const BodySchema = z.object({
  answers: z.record(z.string(), z.unknown()) as unknown as z.ZodType<ScreenerAnswers>,
  sessionId: z.string().optional(),
  turnstileToken: z.string().optional(),
})

export async function POST(req: Request): Promise<Response> {
  const log = getLogger()
  const tracker = getErrorTracker()

  let parsed: z.infer<typeof BodySchema>
  try {
    parsed = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: String(err) },
      { status: 400 },
    )
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET
  if (turnstileSecret) {
    const ok = await verifyTurnstile(parsed.turnstileToken, turnstileSecret, req)
    if (!ok) {
      log.warn('screener.complete turnstile failed')
      return NextResponse.json(
        { error: 'turnstile_failed' },
        { status: 403 },
      )
    }
  }

  const secret = process.env.MAGIC_LINK_SECRET
  if (!secret || secret.length < 32) {
    log.error('screener.complete misconfigured: MAGIC_LINK_SECRET missing or too short')
    return NextResponse.json(
      { error: 'server_misconfigured' },
      { status: 500 },
    )
  }

  const resultsBaseUrl = `${baseUrl(req)}/screener/results`

  try {
    const out = await finalizeScreener(
      { answers: parsed.answers, sessionId: parsed.sessionId },
      {
        repo: getScreenerRepo(),
        publishCompleted: async (payload) => {
          // Inngest persists + retries on failure; the workflow handles
          // the email send durably.
          await inngest.send({
            name: 'platform/screener.completed',
            data: payload,
          })
        },
        secret,
        resultsBaseUrl,
      },
    )
    log.info('screener.complete ok', {
      sessionId: out.session.id,
      qualification: out.result.qualification,
    })
    return NextResponse.json({
      sessionId: out.session.id,
      result: out.result,
      magicLink: out.magicLink,
    })
  } catch (err) {
    log.error('screener.complete failed', { error: String(err) })
    tracker.captureException(err, { route: '/api/screener/complete' })
    return NextResponse.json(
      { error: 'finalize_failed' },
      { status: 500 },
    )
  }
}

function baseUrl(req: Request): string {
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

async function verifyTurnstile(
  token: string | undefined,
  secret: string,
  req: Request,
): Promise<boolean> {
  if (!token) return false
  try {
    const ip = req.headers.get('cf-connecting-ip') ?? undefined
    const formData = new URLSearchParams({ secret, response: token })
    if (ip) formData.set('remoteip', ip)
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: formData },
    )
    const json = (await response.json()) as { success?: boolean }
    return Boolean(json.success)
  } catch {
    return false
  }
}
