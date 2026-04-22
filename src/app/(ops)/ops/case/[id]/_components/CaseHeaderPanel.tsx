import { STATE_COPY, type CaseRecord } from '@contexts/ops'
import type { RecoveryPlan } from '@contexts/recovery'
import { SlaBadge } from './SlaBadge'

/**
 * Left pane of the ops case workspace per PRD 04. Bloomberg-terminal
 * energy: dense, mono numerics, hairline-divided rows, status pill
 * driven by case state.
 *
 * State labels pull from the shared `STATE_COPY` module in
 * `@contexts/ops` — same source as the customer dashboard — so the
 * two surfaces never drift. CSS uppercases the label to match the
 * ops-console typography; the source of truth stays sentence-case.
 */

export interface CaseHeaderPanelProps {
  readonly caseRecord: CaseRecord
  readonly plan: RecoveryPlan
}

export function CaseHeaderPanel({ caseRecord, plan }: CaseHeaderPanelProps) {
  const stateLabel = STATE_COPY[caseRecord.state]?.opsLabel ?? caseRecord.state
  const ageMs = Date.now() - caseRecord.updatedAt.getTime()

  return (
    <aside
      aria-label="Case header"
      className="border-r border-rule p-6"
    >
      <div className="mb-6">
        <SlaBadge state={caseRecord.state} ageMs={ageMs} />
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 font-mono text-xs">
        <dt className="uppercase tracking-[0.18em] text-ink/55">Case</dt>
        <dd className="text-ink" data-testid="case-id">
          {caseRecord.id}
        </dd>

        <dt className="uppercase tracking-[0.18em] text-ink/55">State</dt>
        <dd>
          <span
            data-testid="state-pill"
            data-state={caseRecord.state}
            className="border border-rule px-2 py-0.5 uppercase tracking-[0.16em] text-ink"
          >
            {stateLabel}
          </span>
        </dd>

        <dt className="uppercase tracking-[0.18em] text-ink/55">Tier</dt>
        <dd className="text-ink" data-testid="case-tier">
          {caseRecord.tier === 'mid_market' ? 'MID-MARKET' : 'SMB'}
        </dd>

        <dt className="uppercase tracking-[0.18em] text-ink/55">Path</dt>
        <dd className="text-ink" data-testid="case-path">
          {plan.path.toUpperCase()}
        </dd>

        <dt className="uppercase tracking-[0.18em] text-ink/55">Owner</dt>
        <dd className="text-ink" data-testid="case-owner">
          {caseRecord.ownerStaffId ?? '—'}
        </dd>

        <dt className="uppercase tracking-[0.18em] text-ink/55">Queue</dt>
        <dd className="text-ink" data-testid="case-queue">
          {plan.opsQueue}
        </dd>

        <dt className="uppercase tracking-[0.18em] text-ink/55">SLA</dt>
        <dd className="text-ink">
          <span data-testid="sla-first-touch">{plan.sla.firstTouchHours}h</span>
          <span aria-hidden="true" className="mx-1 text-ink/40">·</span>
          <span data-testid="sla-completion">{plan.sla.completionHours}h</span>
        </dd>
      </dl>

      <div className="mt-8">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
          Action panel
        </h3>
        <ul aria-label="Available actions" className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              data-testid="action-claim"
              disabled
              aria-disabled="true"
              className="w-full border border-rule px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.16em] hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Claim case <kbd className="ml-2 text-ink/55">c</kbd>
            </button>
          </li>
          <li>
            <button
              type="button"
              data-testid="action-stall"
              disabled
              aria-disabled="true"
              className="w-full border border-rule px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.16em] hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Mark stalled <kbd className="ml-2 text-ink/55">x</kbd>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  )
}
