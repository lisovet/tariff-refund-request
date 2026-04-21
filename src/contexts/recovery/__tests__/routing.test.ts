import { describe, expect, it } from 'vitest'
import {
  RECOVERY_QUEUES,
  determineRecoveryPath,
  recoveryPlanFor,
  type RecoveryPath,
} from '../routing'
import type { ClearancePath, ScreenerAnswers } from '@contexts/screener'

function answers(overrides: Partial<ScreenerAnswers>): ScreenerAnswers {
  return { q1: 'yes', q3: 'yes', ...overrides }
}

describe('determineRecoveryPath — table-driven', () => {
  it.each<[ClearancePath, RecoveryPath]>([
    ['broker', 'broker'],
    ['carrier', 'carrier'],
    ['ace_self_filed', 'ace-self-export'],
    ['mixed', 'mixed'],
  ])('q4=%s → %s', (q4, expected) => {
    expect(determineRecoveryPath(answers({ q4 }))).toBe(expected)
  })

  it('returns null when q4 is unanswered', () => {
    expect(determineRecoveryPath(answers({}))).toBeNull()
  })

  it('returns null when the case is disqualified (q1=no)', () => {
    expect(determineRecoveryPath({ q1: 'no', q4: 'broker' })).toBeNull()
  })

  it('returns null when the case is disqualified (q3=no)', () => {
    expect(determineRecoveryPath({ q1: 'yes', q3: 'no', q4: 'carrier' })).toBeNull()
  })
})

describe('recoveryPlanFor — broker path', () => {
  it('targets the recovery-broker queue', () => {
    const plan = recoveryPlanFor('broker')
    expect(plan.path).toBe('broker')
    expect(plan.opsQueue).toBe(RECOVERY_QUEUES.broker)
  })

  it('accepts the v1 broker document set', () => {
    const plan = recoveryPlanFor('broker')
    expect(plan.acceptedDocs).toEqual(
      expect.arrayContaining(['broker_7501', 'broker_spreadsheet']),
    )
  })

  it('outreach template addresses the broker by name placeholder', () => {
    const plan = recoveryPlanFor('broker')
    expect(plan.outreachTemplate.subject).toMatch(/IEEPA/i)
    expect(plan.outreachTemplate.body).toMatch(/\{\{brokerName\}\}/)
    expect(plan.outreachTemplate.body).toMatch(/7501/)
  })

  it('SLA matches the path: 4-hour first touch, 24h completion (Service variant)', () => {
    const plan = recoveryPlanFor('broker')
    expect(plan.sla.firstTouchHours).toBe(4)
    expect(plan.sla.completionHours).toBe(24)
  })
})

describe('recoveryPlanFor — carrier path', () => {
  it('targets the recovery-carrier queue', () => {
    expect(recoveryPlanFor('carrier').opsQueue).toBe(RECOVERY_QUEUES.carrier)
  })

  it('accepts carrier-specific document kinds', () => {
    const plan = recoveryPlanFor('carrier')
    expect(plan.acceptedDocs).toEqual(
      expect.arrayContaining(['carrier_invoice']),
    )
  })

  it('outreach template references the carrier portal flow', () => {
    const plan = recoveryPlanFor('carrier')
    expect(plan.outreachTemplate.body).toMatch(/portal|invoice/i)
  })
})

describe('recoveryPlanFor — ACE path', () => {
  it('targets the recovery-ace queue', () => {
    expect(recoveryPlanFor('ace-self-export').opsQueue).toBe(RECOVERY_QUEUES.ace)
  })

  it('accepts ACE export uploads', () => {
    const plan = recoveryPlanFor('ace-self-export')
    expect(plan.acceptedDocs).toEqual(expect.arrayContaining(['ace_export']))
  })

  it('prerequisite check explicitly mentions an ACE account', () => {
    const plan = recoveryPlanFor('ace-self-export')
    const aceCheck = plan.prerequisiteChecks.find((c) => c.id === 'ace_account')
    expect(aceCheck).toBeDefined()
    expect(aceCheck?.required).toBe(true)
  })
})

describe('recoveryPlanFor — mixed path', () => {
  it('falls back to the broker queue and accepts every doc kind', () => {
    const plan = recoveryPlanFor('mixed')
    expect(plan.opsQueue).toBe(RECOVERY_QUEUES.broker)
    for (const k of [
      'ace_export',
      'broker_7501',
      'broker_spreadsheet',
      'carrier_invoice',
    ]) {
      expect(plan.acceptedDocs).toContain(k)
    }
  })
})

describe('recoveryPlanFor — snapshot (full plan content frozen)', () => {
  it.each<RecoveryPath>(['broker', 'carrier', 'ace-self-export', 'mixed'])(
    'plan content is frozen for %s — change requires explicit snapshot update',
    (path) => {
      expect(recoveryPlanFor(path)).toMatchSnapshot()
    },
  )
})

describe('recoveryPlanFor — every path is non-empty', () => {
  it.each<RecoveryPath>(['broker', 'carrier', 'ace-self-export', 'mixed'])(
    '%s plan has acceptedDocs, opsQueue, sla, outreach template, and prerequisite checks',
    (path) => {
      const plan = recoveryPlanFor(path)
      expect(plan.acceptedDocs.length).toBeGreaterThan(0)
      expect(plan.opsQueue.length).toBeGreaterThan(0)
      expect(plan.sla.firstTouchHours).toBeGreaterThan(0)
      expect(plan.sla.completionHours).toBeGreaterThan(0)
      expect(plan.outreachTemplate.subject.length).toBeGreaterThan(0)
      expect(plan.outreachTemplate.body.length).toBeGreaterThan(0)
      expect(plan.prerequisiteChecks.length).toBeGreaterThan(0)
    },
  )
})
