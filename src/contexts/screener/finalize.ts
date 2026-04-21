// Server-only in spirit (uses node:crypto + Inngest publish), but the
// `server-only` directive lives on `@contexts/screener/server` so this
// module remains importable in vitest.
import { signToken } from './magic-link'
import { computeResult } from './qualification'
import type {
  LeadRecord,
  ScreenerRepo,
  ScreenerSessionRecord,
} from './repo'
import type { ScreenerAnswers, ScreenerResult } from './types'
import { isComplete } from './branching'

/**
 * Server-side screener finalization. Triggered when the client
 * completes q10 (or hits a terminal-DQ shortcut). Per PRD 01:
 *
 *   1. Persist the session (or update an existing one).
 *   2. If the user reached q10 with an email-capture, write a lead
 *      row (idempotent on email + sessionId).
 *   3. Sign a magic-link token good for 7 days.
 *   4. Publish `platform/screener.completed` to Inngest. The lifecycle
 *      workflow #1 (task #28) sends the results email; downstream
 *      cadences (24h, 72h, day-7 — tasks #29/#30) chain off the same
 *      event.
 *   5. Return the computed result + magic-link URL so the client can
 *      render the result inline immediately.
 *
 * Per ADR 007: by publishing instead of sending inline, the email
 * delivery becomes durable + replayable + the trigger for future
 * cadences. Inngest persists the event and retries on failure.
 *
 * Disqualified paths (q1=no, q3=no) record the session but do NOT
 * write a lead or publish a completion event — there's no email to
 * pair them with. The 'screener.disqualified' event lands later if
 * we want a re-engagement cadence.
 */

export interface FinalizeInput {
  readonly answers: ScreenerAnswers
  readonly sessionId?: string
  readonly source?: string // attribution; defaults to 'screener'
}

export interface FinalizeDeps {
  readonly repo: ScreenerRepo
  /** Publishes the screener-completed event for downstream workflows. */
  readonly publishCompleted: (payload: {
    sessionId: string
    email: string
    company: string | null
    magicLink: string
  }) => Promise<void>
  readonly secret: string
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

  // 3. Disqualified paths skip lead + publish; we recorded the session.
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

  // 4. Sign the magic-link.
  const token = signToken(
    { sessionId: completed.id, email },
    { secret: deps.secret, ttlSeconds: MAGIC_LINK_TTL_SECONDS },
  )
  const magicLink = `${deps.resultsBaseUrl}?token=${encodeURIComponent(token)}`

  // 5. Publish — workflow #1 sends the results email; future workflows
  //    chain off the same event for cadenced nudges.
  await deps.publishCompleted({
    sessionId: completed.id,
    email,
    company,
    magicLink,
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
