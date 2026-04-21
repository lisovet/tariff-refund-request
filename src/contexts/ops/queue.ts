import type { CaseRecord } from './repo'
import type { CaseState } from './case-machine'

/**
 * Queue helpers for the ops console — pure. Given a `CaseRecord`
 * + `now`, derive the row the queue page renders (humanized age +
 * SLA breach flag + passthrough of id / state / tier / owner).
 *
 * SLA targets are expressed in milliseconds. Terminal states map
 * to `undefined` — a closed case never breaches SLA.
 */

const H = 60 * 60 * 1000
const D = 24 * H

/**
 * Per PRD 04 §SLA discipline. Tuned to the "humans read the queue
 * within one working shift" bar — first-contact within 24h for
 * new leads, every queue-critical in-flight state within 48h.
 */
export const SLA_TARGETS_BY_STATE: Partial<Record<CaseState, number>> = {
  new_lead: 24 * H,
  qualified: 24 * H,
  awaiting_purchase: 3 * D,
  awaiting_docs: 5 * D,
  entry_recovery_in_progress: 48 * H,
  entry_list_ready: 24 * H,
  awaiting_prep_purchase: 3 * D,
  cape_prep_in_progress: 48 * H,
  batch_qa: 24 * H,
  submission_ready: 24 * H,
  concierge_active: 7 * D,
  filed: 30 * D,
  pending_cbp: 60 * D,
  deficient: 3 * D,
  stalled: 7 * D,
  // disqualified / paid / closed — terminal, no SLA target.
}

export interface QueueRow {
  readonly id: string
  readonly state: CaseState
  readonly tier: 'smb' | 'mid_market'
  readonly ownerStaffId: string | null
  readonly ageMs: number
  readonly ageHumanized: string
  readonly isSlaBreach: boolean
  readonly updatedAtIso: string
}

export function computeQueueRow(c: CaseRecord, now: Date): QueueRow {
  const ageMs = now.getTime() - c.updatedAt.getTime()
  const target = SLA_TARGETS_BY_STATE[c.state]
  return {
    id: c.id,
    state: c.state,
    tier: c.tier,
    ownerStaffId: c.ownerStaffId,
    ageMs,
    ageHumanized: humanizeAge(ageMs),
    isSlaBreach: target !== undefined && ageMs > target,
    updatedAtIso: c.updatedAt.toISOString(),
  }
}

function humanizeAge(ms: number): string {
  if (ms < 60 * 1000) return '<1m'
  if (ms < H) return `${Math.floor(ms / (60 * 1000))}m`
  if (ms < D) return `${Math.floor(ms / H)}h`
  return `${Math.floor(ms / D)}d`
}

export interface QueueFilter {
  readonly states?: readonly CaseState[]
  /** `null` → unassigned; `string` → specific staff id; omit →
   *  any. */
  readonly ownerStaffId?: string | null
  readonly tier?: 'smb' | 'mid_market'
}

export function filterQueue(
  cases: readonly CaseRecord[],
  filter: QueueFilter,
): readonly CaseRecord[] {
  return cases.filter((c) => {
    if (filter.states && !filter.states.includes(c.state)) return false
    if (
      'ownerStaffId' in filter &&
      filter.ownerStaffId !== undefined &&
      c.ownerStaffId !== filter.ownerStaffId
    ) {
      return false
    }
    if (filter.tier && c.tier !== filter.tier) return false
    return true
  })
}

export interface SavedView {
  readonly id: string
  readonly label: string
  readonly filter: QueueFilter | ((viewer: ViewerContext) => QueueFilter)
}

export interface ViewerContext {
  readonly staffId: string
}

export const SAVED_VIEWS: readonly SavedView[] = [
  {
    id: 'unassigned',
    label: 'Unassigned',
    filter: { ownerStaffId: null },
  },
  {
    id: 'my_batch_qa',
    label: 'My batch QA',
    filter: (v) => ({ states: ['batch_qa'], ownerStaffId: v.staffId }),
  },
  {
    id: 'stalled',
    label: 'Stalled',
    filter: { states: ['stalled'] },
  },
  {
    id: 'all_active',
    label: 'All active',
    filter: {
      states: [
        'new_lead',
        'qualified',
        'awaiting_purchase',
        'awaiting_docs',
        'entry_recovery_in_progress',
        'entry_list_ready',
        'awaiting_prep_purchase',
        'cape_prep_in_progress',
        'batch_qa',
        'submission_ready',
        'concierge_active',
        'filed',
        'pending_cbp',
        'deficient',
      ],
    },
  },
] as const

export function resolveSavedView(
  viewId: string,
  viewer: ViewerContext,
): QueueFilter | undefined {
  const v = SAVED_VIEWS.find((x) => x.id === viewId)
  if (!v) return undefined
  return typeof v.filter === 'function' ? v.filter(viewer) : v.filter
}
