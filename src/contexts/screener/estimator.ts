import type {
  Confidence,
  DutyBand,
  RefundEstimate,
  ScreenerAnswers,
} from './types'

/**
 * Refund-estimate function per PRD 01. Every result records the
 * estimator version so we can audit / re-run later. Bands map to a
 * (low, high) pair derived from typical IEEPA refund recovery rates;
 * confidence narrows when key inputs are missing.
 */

export const ESTIMATOR_VERSION = 'v1'

const BAND_RANGES: Record<DutyBand, { low: number; high: number }> = {
  band_under_5k: { low: 200, high: 1500 },
  band_5k_50k: { low: 1500, high: 18000 },
  band_50k_500k: { low: 18000, high: 180000 },
  band_500k_5m: { low: 180000, high: 1800000 },
  band_over_5m: { low: 1800000, high: 8000000 },
}

export function estimateRefund(
  answers: ScreenerAnswers,
): RefundEstimate | null {
  if (!answers.q6) return null
  const range = BAND_RANGES[answers.q6]
  return {
    low: range.low,
    high: range.high,
    confidence: computeConfidence(answers),
    version: ESTIMATOR_VERSION,
  }
}

function computeConfidence(answers: ScreenerAnswers): Confidence {
  if (answers.q2 === 'unknown') return 'low'

  const liquidationKnown = answers.q8 === 'yes' || answers.q8 === 'no'
  const aceKnown = answers.q9 === 'yes'

  if (liquidationKnown && aceKnown) return 'high'
  return 'moderate'
}
