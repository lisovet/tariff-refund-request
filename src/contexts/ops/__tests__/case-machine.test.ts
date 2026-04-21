import { describe, expect, it } from 'vitest'
import {
  CASE_INITIAL_STATE,
  type CaseEvent,
  type CaseState,
  caseMachine,
  isValidTransition,
  nextState,
} from '../case-machine'

/**
 * The case machine is the spine of the platform per PRD 04 + ADR 008.
 *
 * Every transition must be named and guarded; the machine is pure
 * (no I/O); side effects are declared as named XState actions and
 * dispatched by the runner (task #41), not the machine itself.
 *
 * Tests below cover every documented transition + the two hard rules
 * (no auto-fire to filed; submission_ready requires validator role).
 */

function transition(from: CaseState, event: CaseEvent): CaseState {
  return nextState(from, event)
}

describe('caseMachine — initial state', () => {
  it('starts in new_lead', () => {
    expect(CASE_INITIAL_STATE).toBe('new_lead')
    expect(caseMachine.config.initial).toBe('new_lead')
  })
})

describe('caseMachine — every PRD 04 transition', () => {
  it.each<[CaseState, CaseEvent['type'], CaseState]>([
    ['new_lead', 'SCREENER_RESULT_QUALIFIED', 'qualified'],
    ['new_lead', 'SCREENER_RESULT_DISQUALIFIED', 'disqualified'],
    ['qualified', 'LIFECYCLE_DELIVERED', 'awaiting_purchase'],
    ['awaiting_purchase', 'RECOVERY_PURCHASED', 'awaiting_docs'],
    ['awaiting_docs', 'DOCS_UPLOADED_OR_CLAIMED', 'entry_recovery_in_progress'],
    ['entry_recovery_in_progress', 'ANALYST_SIGNED_OFF', 'entry_list_ready'],
    ['entry_recovery_in_progress', 'STALL_DETECTED', 'stalled'],
    ['entry_list_ready', 'HANDOFF_TO_PREP', 'awaiting_prep_purchase'],
    ['awaiting_prep_purchase', 'PREP_PURCHASED', 'cape_prep_in_progress'],
    ['cape_prep_in_progress', 'VALIDATOR_TRIGGERED_QA', 'batch_qa'],
    ['batch_qa', 'QA_FAILED', 'cape_prep_in_progress'],
    ['submission_ready', 'CONCIERGE_PURCHASED', 'concierge_active'],
    ['submission_ready', 'CUSTOMER_FILED', 'filed'],
    ['concierge_active', 'CUSTOMER_FILED', 'filed'],
    ['filed', 'FILING_RECORDED', 'pending_cbp'],
    ['pending_cbp', 'CBP_PAID', 'paid'],
    ['pending_cbp', 'CBP_DEFICIENT', 'deficient'],
    ['deficient', 'DEFICIENT_REPREP', 'cape_prep_in_progress'],
    ['paid', 'SUCCESS_FEE_INVOICED', 'closed'],
  ])('%s --(%s)--> %s', (from, eventType, expected) => {
    const event = buildEvent(eventType)
    expect(transition(from, event)).toBe(expected)
  })
})

describe('caseMachine — hard rules', () => {
  it('VALIDATOR_SIGNED_OFF requires actor.role=validator (PRD 04 hard rule)', () => {
    const allowed = transition('batch_qa', {
      type: 'VALIDATOR_SIGNED_OFF',
      actor: { id: 'stf_1', role: 'validator' },
    })
    expect(allowed).toBe('submission_ready')

    // No actor → blocked.
    const noActor = transition('batch_qa', {
      type: 'VALIDATOR_SIGNED_OFF',
    } as unknown as CaseEvent)
    expect(noActor).toBe('batch_qa')

    // Wrong role → blocked.
    const analyst = transition('batch_qa', {
      type: 'VALIDATOR_SIGNED_OFF',
      actor: { id: 'stf_2', role: 'analyst' },
    })
    expect(analyst).toBe('batch_qa')

    const coordinator = transition('batch_qa', {
      type: 'VALIDATOR_SIGNED_OFF',
      actor: { id: 'stf_3', role: 'coordinator' },
    })
    expect(coordinator).toBe('batch_qa')

    // admin is also denied — only validators may sign off.
    const admin = transition('batch_qa', {
      type: 'VALIDATOR_SIGNED_OFF',
      actor: { id: 'stf_4', role: 'admin' },
    })
    expect(admin).toBe('batch_qa')
  })

  it('never auto-fires CUSTOMER_FILED without an explicit event (no implicit transition)', () => {
    // submission_ready stays put under any non-relevant event.
    expect(
      transition('submission_ready', { type: 'STALL_DETECTED' } as CaseEvent),
    ).toBe('submission_ready')
  })

  it('disqualified is a terminal-with-opt-in: REENGAGEMENT_OPT_IN bounces back to new_lead', () => {
    expect(
      transition('disqualified', { type: 'REENGAGEMENT_OPT_IN' }),
    ).toBe('new_lead')
  })

  it('closed is fully terminal: every event is a no-op', () => {
    const events: CaseEvent[] = [
      { type: 'CBP_PAID' },
      { type: 'STALL_DETECTED' },
      { type: 'REENGAGEMENT_OPT_IN' },
      { type: 'CUSTOMER_FILED' },
    ]
    for (const e of events) {
      expect(transition('closed', e)).toBe('closed')
    }
  })
})

describe('caseMachine — stall + resume', () => {
  it('stalled remembers the previous state via STALL_RESUMED payload', () => {
    expect(
      transition('stalled', {
        type: 'STALL_RESUMED',
        resumeTo: 'entry_recovery_in_progress',
      }),
    ).toBe('entry_recovery_in_progress')
  })

  it('STALL_RESUMED can only land on a non-terminal in-progress state', () => {
    // Resuming back to "closed" or "disqualified" must be a no-op.
    expect(
      transition('stalled', {
        type: 'STALL_RESUMED',
        resumeTo: 'closed',
      }),
    ).toBe('stalled')
  })
})

describe('caseMachine — invalid transitions are no-ops', () => {
  it('emits the same state when an event is not declared at the current state', () => {
    // qualified does not accept STALL_DETECTED.
    expect(
      transition('qualified', { type: 'STALL_DETECTED' }),
    ).toBe('qualified')
    // new_lead does not accept LIFECYCLE_DELIVERED.
    expect(
      transition('new_lead', { type: 'LIFECYCLE_DELIVERED' }),
    ).toBe('new_lead')
  })
})

describe('isValidTransition (predicate)', () => {
  it('true for documented transitions', () => {
    expect(
      isValidTransition('cape_prep_in_progress', {
        type: 'VALIDATOR_TRIGGERED_QA',
      }),
    ).toBe(true)
  })

  it('false when the event would no-op the machine', () => {
    expect(
      isValidTransition('new_lead', { type: 'CBP_PAID' }),
    ).toBe(false)
  })

  it('false when a guard blocks the transition (validator-role gate)', () => {
    expect(
      isValidTransition('batch_qa', {
        type: 'VALIDATOR_SIGNED_OFF',
        actor: { id: 'stf_a', role: 'analyst' },
      }),
    ).toBe(false)
  })
})

function buildEvent(type: CaseEvent['type']): CaseEvent {
  if (type === 'VALIDATOR_SIGNED_OFF') {
    return {
      type,
      actor: { id: 'stf_validator_test', role: 'validator' },
    }
  }
  if (type === 'STALL_RESUMED') {
    return { type, resumeTo: 'entry_recovery_in_progress' }
  }
  return { type } as CaseEvent
}
