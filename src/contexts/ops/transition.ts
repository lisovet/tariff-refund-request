import {
  type ActorRef,
  type CaseEvent,
  type CaseState,
  isValidTransition,
  nextState,
} from './case-machine'
import type { CaseRepo } from './repo'

/**
 * Pure-ish case service. Wraps the XState machine + the persistence
 * layer + the Inngest publish hook into a single transactional
 * operation per PRD 04 + ADR 008.
 *
 * Flow:
 *   1. Load the case (or 404).
 *   2. Compute next state via the machine.
 *   3. If unchanged → guard_rejected | invalid_transition (the two
 *      reasons are distinguished by re-running with a synthetic
 *      validator-role actor on VALIDATOR_SIGNED_OFF only).
 *   4. recordTransition() — DB writes case.state + audit_log row in
 *      a single transaction (the repo is responsible for atomicity).
 *   5. publishCaseTransitioned — fires Inngest. Failure here does
 *      NOT roll back the DB write; the transition has happened.
 *      The Inngest failure is logged and observable.
 */

export type TransitionResult =
  | {
      readonly ok: true
      readonly caseId: string
      readonly from: CaseState
      readonly to: CaseState
      readonly auditId: string
    }
  | {
      readonly ok: false
      readonly caseId: string
      readonly reason:
        | 'case_not_found'
        | 'invalid_transition'
        | 'guard_rejected'
      readonly from?: CaseState
    }

export interface TransitionInput {
  readonly caseId: string
  readonly event: CaseEvent
  readonly actor?: ActorRef
}

export interface CaseTransitionedPayload {
  readonly caseId: string
  readonly from: CaseState
  readonly to: CaseState
  readonly actorId: string
}

export interface TransitionDeps {
  readonly repo: CaseRepo
  readonly publishCaseTransitioned: (
    payload: CaseTransitionedPayload,
  ) => Promise<void>
  readonly clock?: () => Date
}

export async function transition(
  input: TransitionInput,
  deps: TransitionDeps,
): Promise<TransitionResult> {
  const now = (deps.clock ?? defaultClock)()
  const record = await deps.repo.findCase(input.caseId)
  if (!record) {
    return { ok: false, caseId: input.caseId, reason: 'case_not_found' }
  }
  const from = record.state
  const enriched = withActor(input.event, input.actor)
  const to = nextState(from, enriched)
  if (to === from) {
    const reason = guardOrInvalid(from, enriched, input.actor)
    return { ok: false, caseId: input.caseId, reason, from }
  }

  const { auditId } = await deps.repo.recordTransition({
    caseId: input.caseId,
    from,
    to,
    event: enriched,
    actorId: input.actor?.id ?? null,
    occurredAt: now,
  })

  await deps.publishCaseTransitioned({
    caseId: input.caseId,
    from,
    to,
    actorId: input.actor?.id ?? 'system',
  })

  return { ok: true, caseId: input.caseId, from, to, auditId }
}

function defaultClock(): Date {
  return new Date()
}

/**
 * Distinguishes a guard-rejection from an invalid (no-op) event. The
 * caller sees a more useful error: a UI can surface "you don't have
 * permission" vs "that transition isn't legal from this state."
 *
 * We detect a guard rejection by re-running the machine with the same
 * event but a synthetic validator-role actor. If the machine *would*
 * have advanced, the original failure was a guard rejection.
 */
function guardOrInvalid(
  from: CaseState,
  event: CaseEvent,
  actor: ActorRef | undefined,
): 'invalid_transition' | 'guard_rejected' {
  // Only VALIDATOR_SIGNED_OFF is currently guard-protected. If we add
  // more guards, gate them here. Avoids running expensive synthetic
  // probes for every failed event.
  if (event.type !== 'VALIDATOR_SIGNED_OFF') return 'invalid_transition'
  if (actor?.role === 'validator') return 'invalid_transition' // shouldn't happen
  const synthetic: CaseEvent = {
    type: 'VALIDATOR_SIGNED_OFF',
    actor: { id: 'probe', role: 'validator' },
  }
  return isValidTransition(from, synthetic) ? 'guard_rejected' : 'invalid_transition'
}

function withActor(event: CaseEvent, actor: ActorRef | undefined): CaseEvent {
  if (event.type !== 'VALIDATOR_SIGNED_OFF') return event
  if ('actor' in event && event.actor) return event
  if (!actor) return event
  return { ...event, actor }
}
