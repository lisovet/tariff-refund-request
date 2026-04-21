import type { CaseState } from '@contexts/ops'
import { computeSlaStatus, formatRemainingHumanized } from '@contexts/ops'

/**
 * SlaBadge — compact status indicator for the case header per PRD 04.
 *
 * Pulls the band from `computeSlaStatus` so the design-language
 * status palette (positive / warning / blocking / ink) stays the
 * single color authority. Terminal states render a "— no SLA"
 * placeholder so the slot is always there.
 */

export interface SlaBadgeProps {
  readonly state: CaseState
  readonly ageMs: number
}

const BAND_CLASSES: Record<'none' | 'ok' | 'warning' | 'breach', string> = {
  none: 'border-rule text-ink/60',
  ok: 'border-positive/40 text-positive',
  warning: 'border-warning/60 text-warning',
  breach: 'border-blocking/60 text-blocking',
}

export function SlaBadge({ state, ageMs }: SlaBadgeProps) {
  const status = computeSlaStatus(state, ageMs)

  if (status.band === 'none') {
    return (
      <div
        className={`inline-flex flex-col border px-3 py-2 ${BAND_CLASSES.none}`}
        data-testid="sla-badge"
        data-band="none"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
          SLA
        </span>
        <span className="mt-1 font-mono text-sm tabular-nums">—</span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
          no SLA
        </span>
      </div>
    )
  }

  const label = computeLabel(status.band, status.remainingMs)
  return (
    <div
      className={`inline-flex flex-col border px-3 py-2 ${BAND_CLASSES[status.band]}`}
      data-testid="sla-badge"
      data-band={status.band}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
        SLA
      </span>
      <span className="mt-1 font-mono text-sm tabular-nums">
        {formatRemainingHumanized(status.remainingMs)}
      </span>
      <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
        {label}
      </span>
    </div>
  )
}

function computeLabel(band: 'ok' | 'warning' | 'breach', remainingMs: number) {
  if (band === 'breach') return 'overdue'
  if (band === 'warning') return 'due soon'
  // ok
  if (remainingMs < 12 * 60 * 60 * 1000) return 'on track'
  return 'on track'
}
