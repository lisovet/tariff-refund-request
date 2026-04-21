import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getScreenerRepo } from '@contexts/screener/server'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * POST /api/screener/notify-me
 *
 * Body: { sessionId: string, email: string, consent: true }
 *
 * Captures an email from a disqualified screener user so we can reach
 * out if eligibility rules change. Idempotent on (email, sessionId)
 * via the `leads_email_session_idx` unique index. Rejects sessions
 * whose result is anything other than `disqualified` so this endpoint
 * can't be used as a backdoor for qualified lead capture — those go
 * through /api/screener/complete.
 */

const NOTIFY_SOURCE = 'disqualified_notify'

const BodySchema = z.object({
  sessionId: z.string().min(1),
  email: z.string().email(),
  consent: z.literal(true),
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

  try {
    const repo = getScreenerRepo()
    const session = await repo.findSessionById(parsed.sessionId)
    if (!session) {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
    }
    if (session.result?.qualification !== 'disqualified') {
      return NextResponse.json(
        { error: 'session_not_disqualified' },
        { status: 400 },
      )
    }

    await repo.createLead({
      email: parsed.email.trim().toLowerCase(),
      company: null,
      screenerSessionId: session.id,
      source: NOTIFY_SOURCE,
    })

    log.info('screener.notify-me ok', { sessionId: session.id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    log.error('screener.notify-me failed', { error: String(err) })
    tracker.captureException(err, { route: '/api/screener/notify-me' })
    return NextResponse.json({ error: 'capture_failed' }, { status: 500 })
  }
}
