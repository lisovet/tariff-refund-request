import { describe, expect, it } from 'vitest'
import {
  ESTIMATOR_VERSION,
  estimateRefund,
} from '../estimator'
import type { ScreenerAnswers } from '../types'

/**
 * Refund-estimate function. Pure + versioned per PRD 01: every result
 * records which estimator version produced it so we can re-run / audit
 * later. The estimate is a band (low, high) plus a confidence label.
 */

describe('estimateRefund — version stamp', () => {
  it('exports a versioned constant for traceability', () => {
    expect(ESTIMATOR_VERSION).toMatch(/^v\d+$/)
  })

  it('every result carries the estimator version', () => {
    const out = estimateRefund({ q1: 'yes', q6: 'band_50k_500k' })
    expect(out?.version).toBe(ESTIMATOR_VERSION)
  })
})

describe('estimateRefund — duty bands', () => {
  it('returns null when q6 is missing', () => {
    expect(estimateRefund({ q1: 'yes' })).toBeNull()
  })

  it('produces a low/high pair where low ≤ high', () => {
    const bands = [
      'band_under_5k',
      'band_5k_50k',
      'band_50k_500k',
      'band_500k_5m',
      'band_over_5m',
    ] as const
    for (const b of bands) {
      const out = estimateRefund({ q1: 'yes', q6: b })
      expect(out).not.toBeNull()
      expect(out!.low).toBeGreaterThanOrEqual(0)
      expect(out!.high).toBeGreaterThanOrEqual(out!.low)
    }
  })

  it('higher duty bands produce strictly larger upper estimates', () => {
    const small = estimateRefund({ q1: 'yes', q6: 'band_5k_50k' })!
    const large = estimateRefund({ q1: 'yes', q6: 'band_500k_5m' })!
    expect(large.high).toBeGreaterThan(small.high)
  })
})

describe('estimateRefund — confidence', () => {
  it('downgrades confidence when country is "unknown"', () => {
    const known: ScreenerAnswers = { q1: 'yes', q2: 'CN', q6: 'band_50k_500k' }
    const unknown: ScreenerAnswers = {
      q1: 'yes',
      q2: 'unknown',
      q6: 'band_50k_500k',
    }
    expect(estimateRefund(known)?.confidence).toBe('moderate')
    expect(estimateRefund(unknown)?.confidence).toBe('low')
  })

  it('upgrades confidence when liquidation status is known + ACE access exists', () => {
    const out = estimateRefund({
      q1: 'yes',
      q2: 'CN',
      q6: 'band_50k_500k',
      q8: 'yes',
      q9: 'yes',
    })
    expect(out?.confidence).toBe('high')
  })
})
