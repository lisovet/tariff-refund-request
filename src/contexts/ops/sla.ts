import type { CaseState } from './case-machine'
import { SLA_TARGETS_BY_STATE } from './queue'

/**
 * SLA math for the ops console per PRD 04.
 *
 * `computeSlaStatus(state, ageMs)` resolves an `SlaStatus` whose
 * `band` drives the design-language status palette:
 *
 *   - `'ok'`      → positive (green ink). Still within target.
 *   - `'warning'` → warning (warm amber). Elapsed >= 80% of target.
 *   - `'breach'`  → blocking (severe red). Elapsed > target.
 *   - `'none'`    → no SLA (terminal state). Badge renders as "—".
 *
 * The 80% warning threshold is exposed as `SLA_WARNING_PCT` so
 * a tune lands in one place.
 */

export const SLA_BANDS = ['ok', 'warning', 'breach'] as const
export type SlaBand = (typeof SLA_BANDS)[number] | 'none'

export const SLA_WARNING_PCT = 0.8

export type SlaStatus =
  | {
      readonly band: 'none'
      readonly targetMs?: undefined
      readonly remainingMs?: undefined
      readonly elapsedPctOfTarget?: undefined
    }
  | {
      readonly band: 'ok' | 'warning' | 'breach'
      readonly targetMs: number
      readonly remainingMs: number
      readonly elapsedPctOfTarget: number
    }

export function computeSlaStatus(state: CaseState, ageMs: number): SlaStatus {
  const target = SLA_TARGETS_BY_STATE[state]
  if (target === undefined) {
    return { band: 'none' }
  }

  const remainingMs = target - ageMs
  const elapsedPctOfTarget = ageMs / target

  if (remainingMs < 0) {
    return { band: 'breach', targetMs: target, remainingMs, elapsedPctOfTarget }
  }
  if (elapsedPctOfTarget >= SLA_WARNING_PCT && remainingMs > 0) {
    return {
      band: 'warning',
      targetMs: target,
      remainingMs,
      elapsedPctOfTarget,
    }
  }
  return { band: 'ok', targetMs: target, remainingMs, elapsedPctOfTarget }
}

const H = 60 * 60 * 1000
const D = 24 * H

export function formatRemainingHumanized(remainingMs: number | undefined): string {
  if (remainingMs === undefined) return '—'
  if (remainingMs >= 0) return formatDuration(remainingMs)
  return `${formatDuration(-remainingMs)} overdue`
}

function formatDuration(ms: number): string {
  if (ms < 60 * 1000) return '<1m'
  if (ms < H) return `${Math.floor(ms / (60 * 1000))}m`
  if (ms < D) return `${Math.floor(ms / H)}h`
  return `${Math.floor(ms / D)}d`
}
