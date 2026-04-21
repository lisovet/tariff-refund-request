// Server-only in spirit (uses node:crypto via magic-link + email
// transport with Node-only deps), but the `server-only` directive
// lives on `@contexts/screener/server` so this module remains
// importable in vitest.
import {
  ScreenerResultsEmail,
  renderEmail,
  type EmailTransport,
} from '@shared/infra/email'
import { isComplete } from './branching'
import { signToken } from './magic-link'
import { computeResult } from './qualification'
import type {
  LeadRecord,
  ScreenerRepo,
  ScreenerSessionRecord,
} from './repo'
import type { ScreenerAnswers, ScreenerResult } from './types'

/**
 * Server-side screener finalization. Triggered when the client
 * completes q10 (or hits a terminal-DQ shortcut). Per PRD 01:
 *
 *   1. Persist the session (or update an existing one).
 *   2. If the user reached q10 with an email-capture, write a lead
 *      row (idempotent on email + sessionId) and queue the magic-link
 *      results email.
 *   3. Return the computed result + magic-link URL so the client can
 *      both render the result inline and confirm delivery.
 *
 * Disqualified paths (q1=no, q3=no) record the session but do NOT
 * write a lead — there's no email-capture to pair them with.
 */

export interface FinalizeInput {
  readonly answers: ScreenerAnswers
  readonly sessionId?: string
  readonly source?: string // attribution; defaults to 'screener'
}

export interface FinalizeDeps {
  readonly repo: ScreenerRepo
  readonly email: EmailTransport
  readonly secret: string
  readonly fromAddress: string
  readonly resultsBaseUrl: string
}

export interface FinalizeOutput {
  readonly session: ScreenerSessionRecord
  readonly lead: LeadRecord | null
  readonly result: ScreenerResult
  readonly magicLink: string | null
}

const MAGIC_LINK_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days per PRD 01

export async function finalizeScreener(
  input: FinalizeInput,
  deps: FinalizeDeps,
): Promise<FinalizeOutput> {
  if (!isComplete(input.answers)) {
    throw new Error('cannot finalize an incomplete screener flow')
  }

  // 1. Session — create or upsert.
  const session = input.sessionId
    ? await ensureSession(deps.repo, input.sessionId, input.answers)
    : await deps.repo.createSession({ answers: input.answers })

  // 2. Compute the result + complete the session.
  const result = computeResult(input.answers)
  const completed = await deps.repo.completeSession(session.id, result)

  // 3. Disqualified paths skip lead + email; we recorded the session.
  if (result.qualification === 'disqualified' || !input.answers.q10) {
    return { session: completed, lead: null, result, magicLink: null }
  }

  const { company, email } = input.answers.q10
  const lead = await deps.repo.createLead({
    email,
    company,
    screenerSessionId: completed.id,
    source: input.source ?? 'screener',
  })

  // 4. Sign the magic-link + send the email.
  const token = signToken(
    { sessionId: completed.id, email },
    { secret: deps.secret, ttlSeconds: MAGIC_LINK_TTL_SECONDS },
  )
  const magicLink = `${deps.resultsBaseUrl}?token=${encodeURIComponent(token)}`

  const rendered = await renderEmail(
    ScreenerResultsEmail({
      firstName: firstNameOf(company),
      resultsUrl: magicLink,
    }),
  )

  await deps.email.send({
    from: deps.fromAddress,
    to: email,
    subject: 'Your screener results.',
    html: rendered.html,
    text: rendered.text,
    idempotencyKey: `screener-results:${completed.id}`,
  })

  return { session: completed, lead, result, magicLink }
}

async function ensureSession(
  repo: ScreenerRepo,
  sessionId: string,
  answers: ScreenerAnswers,
): Promise<ScreenerSessionRecord> {
  const existing = await repo.findSessionById(sessionId)
  if (existing) {
    return repo.updateAnswers(sessionId, answers)
  }
  return repo.createSession({ answers })
}

function firstNameOf(company: string | null | undefined): string | undefined {
  // We don't capture the customer's name in v1 — the company string is
  // the closest substitute for a personalized greeting, and even that's
  // optional. Returning undefined falls back to a generic salutation.
  if (!company) return undefined
  // Heuristic: if the company looks like "Acme Imports", surface "Acme".
  const first = company.trim().split(/\s+/u)[0]
  return first && first.length <= 24 ? first : undefined
}
