/**
 * IEEPA window + phase configuration per PRD 07.
 *
 * The window dates and phase boundaries are versioned so a batch
 * tagged at ingest time is reproducible later — even after the
 * official window dates are updated. The DB stores `windowVersion`
 * + `phaseFlag` per entry; downstream queries pin both.
 *
 * v1 ships placeholder boundaries that bracket the current IEEPA
 * tariff window. TODO(human-action): confirm exact start/end +
 * phase boundaries with customs counsel before launch.
 */

export interface IeepaPhase {
  readonly id: string
  readonly label: string
  readonly startIso: string
  readonly endIso: string
}

export interface IeepaWindow {
  readonly version: string
  readonly startIso: string
  readonly endIso: string
  readonly phases: readonly IeepaPhase[]
}

const IEEPA_V1_2024: IeepaWindow = {
  version: 'ieepa-v1-2024',
  startIso: '2024-04-01',
  endIso: '2025-12-31',
  phases: [
    { id: 'phase_1_2024_h2', label: 'Phase 1 (Apr–Sep 2024)', startIso: '2024-04-01', endIso: '2024-09-30' },
    { id: 'phase_2_2024_q4', label: 'Phase 2 (Oct–Dec 2024)', startIso: '2024-10-01', endIso: '2024-12-31' },
    { id: 'phase_3_2025_h1', label: 'Phase 3 (Jan–Jun 2025)', startIso: '2025-01-01', endIso: '2025-06-30' },
    { id: 'phase_4_2025_h2', label: 'Phase 4 (Jul–Dec 2025)', startIso: '2025-07-01', endIso: '2025-12-31' },
  ],
} as const

export const IEEPA_WINDOWS: readonly IeepaWindow[] = [IEEPA_V1_2024] as const

export const CURRENT_IEEPA_WINDOW: IeepaWindow = IEEPA_V1_2024

export interface TagEntryInput {
  readonly entryDate: string | null | undefined
}

export interface EntryWindowTag {
  readonly inWindow: boolean
  readonly windowVersion: string
  readonly phaseFlag: string | null
}

export function tagEntry(input: TagEntryInput, window: IeepaWindow): EntryWindowTag {
  const date = input.entryDate
  const ts = parseIsoDate(date)
  if (ts === null) {
    return { inWindow: false, windowVersion: window.version, phaseFlag: null }
  }
  const start = parseIsoDate(window.startIso) as number
  const end = parseIsoDate(window.endIso) as number

  if (ts < start || ts > end) {
    return { inWindow: false, windowVersion: window.version, phaseFlag: null }
  }

  const phaseFlag = phaseFor(ts, window.phases)
  return {
    inWindow: true,
    windowVersion: window.version,
    phaseFlag,
  }
}

function phaseFor(ts: number, phases: readonly IeepaPhase[]): string | null {
  // Walk in reverse so a date sitting on a boundary lands in the
  // LATER phase (start-inclusive semantics).
  for (let i = phases.length - 1; i >= 0; i--) {
    const p = phases[i]
    if (!p) continue
    const s = parseIsoDate(p.startIso) as number
    const e = parseIsoDate(p.endIso) as number
    if (ts >= s && ts <= e) return p.id
  }
  return null
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(date: string | null | undefined): number | null {
  if (!date || !ISO_DATE_RE.test(date)) return null
  const ts = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(ts)) return null
  return ts
}
