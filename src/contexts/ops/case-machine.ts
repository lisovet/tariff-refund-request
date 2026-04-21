import { createActor, createMachine } from 'xstate'

/**
 * The case state machine — the spine of the platform per PRD 04 +
 * ADR 008. Every state transition is named and guarded; the machine
 * is pure (no I/O); side effects are declared as XState actions and
 * dispatched by the runner (added in task #41).
 *
 * The DB column `cases.state` is a denormalization of the machine's
 * current state — written only via this machine.
 *
 * Hard rules (per .ralph/PROMPT.md):
 *   - Never auto-fire CUSTOMER_FILED — must come from a real event.
 *   - VALIDATOR_SIGNED_OFF requires actor.role === 'validator' to
 *     enter `submission_ready`. Any other actor (including admin) is
 *     denied at the guard level so we never produce a Readiness
 *     Report that wasn't human-validated.
 *
 * XState types are intentionally kept private to this file — public
 * surface is `CaseState`, `CaseEvent`, `nextState`, and
 * `isValidTransition`. Per ADR 008's warning about leaking XState
 * types into context APIs.
 */

export type CaseState =
  | 'new_lead'
  | 'qualified'
  | 'disqualified'
  | 'awaiting_purchase'
  | 'awaiting_docs'
  | 'entry_recovery_in_progress'
  | 'entry_list_ready'
  | 'awaiting_prep_purchase'
  | 'cape_prep_in_progress'
  | 'batch_qa'
  | 'submission_ready'
  | 'concierge_active'
  | 'filed'
  | 'pending_cbp'
  | 'deficient'
  | 'paid'
  | 'stalled'
  | 'closed'

export const CASE_INITIAL_STATE: CaseState = 'new_lead'

export type StaffRole = 'coordinator' | 'analyst' | 'validator' | 'admin'

export interface ActorRef {
  readonly id: string
  readonly role: StaffRole
}

/**
 * Set of states a stalled case may legitimately resume into. Anything
 * outside this set is rejected at the guard level — you can't stall
 * a closed case back into life, and you can't resume into a terminal
 * state.
 */
const RESUMABLE_STATES = new Set<CaseState>([
  'awaiting_docs',
  'entry_recovery_in_progress',
  'entry_list_ready',
  'awaiting_prep_purchase',
  'cape_prep_in_progress',
  'batch_qa',
  'submission_ready',
  'concierge_active',
  'pending_cbp',
])

export type CaseEvent =
  | { type: 'SCREENER_RESULT_QUALIFIED' }
  | { type: 'SCREENER_RESULT_DISQUALIFIED' }
  | { type: 'LIFECYCLE_DELIVERED' }
  | { type: 'RECOVERY_PURCHASED' }
  | { type: 'DOCS_UPLOADED_OR_CLAIMED' }
  | { type: 'ANALYST_SIGNED_OFF' }
  | { type: 'STALL_DETECTED' }
  | { type: 'STALL_RESUMED'; resumeTo: CaseState }
  | { type: 'HANDOFF_TO_PREP' }
  | { type: 'PREP_PURCHASED' }
  | { type: 'VALIDATOR_TRIGGERED_QA' }
  | { type: 'VALIDATOR_SIGNED_OFF'; actor: ActorRef }
  | { type: 'QA_FAILED' }
  | { type: 'CONCIERGE_PURCHASED' }
  | { type: 'CUSTOMER_FILED' }
  | { type: 'FILING_RECORDED' }
  | { type: 'CBP_PAID' }
  | { type: 'CBP_DEFICIENT' }
  | { type: 'DEFICIENT_REPREP' }
  | { type: 'SUCCESS_FEE_INVOICED' }
  | { type: 'REENGAGEMENT_OPT_IN' }

export const caseMachine = createMachine({
  id: 'case',
  initial: CASE_INITIAL_STATE,
  context: {},
  types: {} as {
    context: Record<string, never>
    events: CaseEvent
  },
  states: {
    new_lead: {
      on: {
        SCREENER_RESULT_QUALIFIED: { target: 'qualified' },
        SCREENER_RESULT_DISQUALIFIED: { target: 'disqualified' },
      },
    },
    qualified: {
      on: {
        LIFECYCLE_DELIVERED: { target: 'awaiting_purchase' },
      },
    },
    disqualified: {
      on: {
        // Terminal-with-opt-in. The customer can re-enter the funnel
        // via the re-engagement cadence; we send them back to new_lead
        // so the screener result is recomputed against current data.
        REENGAGEMENT_OPT_IN: { target: 'new_lead' },
      },
    },
    awaiting_purchase: {
      on: {
        RECOVERY_PURCHASED: { target: 'awaiting_docs' },
      },
    },
    awaiting_docs: {
      on: {
        DOCS_UPLOADED_OR_CLAIMED: { target: 'entry_recovery_in_progress' },
        STALL_DETECTED: { target: 'stalled' },
      },
    },
    entry_recovery_in_progress: {
      on: {
        ANALYST_SIGNED_OFF: { target: 'entry_list_ready' },
        STALL_DETECTED: { target: 'stalled' },
      },
    },
    entry_list_ready: {
      on: {
        HANDOFF_TO_PREP: { target: 'awaiting_prep_purchase' },
        STALL_DETECTED: { target: 'stalled' },
      },
    },
    awaiting_prep_purchase: {
      on: {
        PREP_PURCHASED: { target: 'cape_prep_in_progress' },
        STALL_DETECTED: { target: 'stalled' },
      },
    },
    cape_prep_in_progress: {
      on: {
        VALIDATOR_TRIGGERED_QA: { target: 'batch_qa' },
        STALL_DETECTED: { target: 'stalled' },
      },
    },
    batch_qa: {
      on: {
        VALIDATOR_SIGNED_OFF: {
          target: 'submission_ready',
          guard: ({ event }) =>
            event.type === 'VALIDATOR_SIGNED_OFF' &&
            event.actor?.role === 'validator',
        },
        QA_FAILED: { target: 'cape_prep_in_progress' },
      },
    },
    submission_ready: {
      on: {
        CONCIERGE_PURCHASED: { target: 'concierge_active' },
        CUSTOMER_FILED: { target: 'filed' },
      },
    },
    concierge_active: {
      on: {
        CUSTOMER_FILED: { target: 'filed' },
      },
    },
    filed: {
      on: {
        FILING_RECORDED: { target: 'pending_cbp' },
      },
    },
    pending_cbp: {
      on: {
        CBP_PAID: { target: 'paid' },
        CBP_DEFICIENT: { target: 'deficient' },
        STALL_DETECTED: { target: 'stalled' },
      },
    },
    deficient: {
      on: {
        DEFICIENT_REPREP: { target: 'cape_prep_in_progress' },
      },
    },
    paid: {
      on: {
        SUCCESS_FEE_INVOICED: { target: 'closed' },
      },
    },
    stalled: {
      on: {
        STALL_RESUMED: [
          {
            // Dynamic target chosen by the runner via re-derivation;
            // the guard pins the legal resume targets.
            guard: ({ event }) =>
              event.type === 'STALL_RESUMED' &&
              RESUMABLE_STATES.has(event.resumeTo),
            target: 'awaiting_docs', // placeholder; actual landing computed in nextState()
          },
        ],
      },
    },
    closed: {
      // Terminal — every event is a no-op.
      type: 'final',
    },
  },
})

/**
 * Pure transition function. Returns the next state if the event would
 * advance the machine, otherwise returns `current` unchanged.
 *
 * Spawns a fresh actor per call — cheap (the machine has no context
 * + no entry actions); keeps the function deterministic.
 *
 * Special-case: STALL_RESUMED's target is data-driven (the resumeTo
 * payload determines the landing state). We model the legal-target
 * guard inside the machine and then post-resolve the target here.
 */
export function nextState(current: CaseState, event: CaseEvent): CaseState {
  if (current === 'stalled' && event.type === 'STALL_RESUMED') {
    return RESUMABLE_STATES.has(event.resumeTo) ? event.resumeTo : 'stalled'
  }

  const actor = createActor(caseMachine, {
    snapshot: caseMachine.resolveState({ value: current, context: {} }),
  })
  actor.start()
  actor.send(event)
  const value = actor.getSnapshot().value as CaseState
  actor.stop()
  return value
}

export function isValidTransition(current: CaseState, event: CaseEvent): boolean {
  return nextState(current, event) !== current
}
