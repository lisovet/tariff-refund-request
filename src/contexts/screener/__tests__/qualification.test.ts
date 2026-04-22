import { describe, expect, it } from 'vitest'
import { computeResult } from '../qualification'
import type { ScreenerAnswers } from '../types'

const happyPath: ScreenerAnswers = {
  q1: 'yes',
  q2: 'CN',
  q3: 'yes',
  q4: 'broker',
  q5: '50_500',
  q6: 'band_50k_500k',
  q7: { categories: ['consumer_electronics'] },
  q8: 'yes',
  q9: 'yes',
  q10: { company: 'Acme', email: 'a@b.co' },
}

describe('computeResult — qualification', () => {
  it('disqualifies when q1 = no with reason no_imports_in_window', () => {
    const r = computeResult({ q1: 'no' })
    expect(r.qualification).toBe('disqualified')
    expect(r.disqualificationReason).toBe('no_imports_in_window')
    expect(r.refundEstimate).toBeNull()
    expect(r.recoveryPath).toBeNull()
    expect(r.recommendedNextStep).toBe('none')
  })

  it('disqualifies when q3 = no with reason not_ior', () => {
    const r = computeResult({ q1: 'yes', q2: 'CN', q3: 'no' })
    expect(r.qualification).toBe('disqualified')
    expect(r.disqualificationReason).toBe('not_ior')
  })

  it('qualifies on the happy path', () => {
    const r = computeResult(happyPath)
    expect(r.qualification).toBe('qualified')
    expect(r.refundEstimate).not.toBeNull()
    expect(r.recoveryPath).toBe('broker')
    expect(r.recommendedNextStep).toBeOneOf([
      'recovery_kit',
      'recovery_service',
      'cape_prep',
      'concierge',
    ])
  })

  it('falls back to "likely_qualified" when key data is missing but no DQ trigger fired', () => {
    const r = computeResult({ q1: 'yes', q2: 'unknown', q3: 'yes' })
    expect(r.qualification).toBe('likely_qualified')
  })
})

describe('computeResult — recovery path', () => {
  it('routes broker when q4 = broker', () => {
    expect(computeResult({ ...happyPath, q4: 'broker' }).recoveryPath).toBe(
      'broker',
    )
  })
  it('routes carrier when q4 = carrier', () => {
    expect(computeResult({ ...happyPath, q4: 'carrier' }).recoveryPath).toBe(
      'carrier',
    )
  })
  it('routes ace-self-export when q4 = ace_self_filed', () => {
    expect(
      computeResult({ ...happyPath, q4: 'ace_self_filed' }).recoveryPath,
    ).toBe('ace-self-export')
  })
  it('routes mixed when q4 = mixed', () => {
    expect(computeResult({ ...happyPath, q4: 'mixed' }).recoveryPath).toBe(
      'mixed',
    )
  })
  it('returns null recoveryPath when q4 not yet answered', () => {
    expect(
      computeResult({ q1: 'yes', q2: 'CN', q3: 'yes' }).recoveryPath,
    ).toBeNull()
  })
})

describe('computeResult — prerequisites', () => {
  it('reports IOR true when q3 = yes', () => {
    expect(computeResult(happyPath).prerequisites.ior).toBe(true)
  })

  it('reports liquidationKnown false when q8 = dont_know', () => {
    const r = computeResult({ ...happyPath, q8: 'dont_know' })
    expect(r.prerequisites.liquidationKnown).toBe(false)
  })

  it('reports ACE true when q9 = yes', () => {
    const r = computeResult({ ...happyPath, q9: 'yes' })
    expect(r.prerequisites.ace).toBe(true)
  })

  it('reports ACH false by default (we never ask in v1)', () => {
    expect(computeResult(happyPath).prerequisites.ach).toBe(false)
  })
})

describe('computeResult — recommendedNextStep', () => {
  it('points small-duty qualified leads at recovery_kit', () => {
    const r = computeResult({ ...happyPath, q6: 'band_5k_50k' })
    expect(r.recommendedNextStep).toBe('recovery_kit')
  })

  it('points mid-band qualified leads at recovery_service', () => {
    const r = computeResult({ ...happyPath, q6: 'band_50k_500k' })
    expect(r.recommendedNextStep).toBe('recovery_service')
  })

  it('points large-duty qualified leads with mixed paths at concierge', () => {
    const r = computeResult({
      ...happyPath,
      q4: 'mixed',
      q6: 'band_over_5m',
    })
    expect(r.recommendedNextStep).toBe('concierge')
  })
})
