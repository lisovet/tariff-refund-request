import type { CaseState } from '@contexts/ops'
import { ExtractionFormPanel } from './ExtractionFormPanel'

/**
 * Center pane of the case workspace — adaptive per `CaseState` per
 * PRD 04 §Case workspace. Each state maps to the surface the
 * analyst actually needs to operate on that state; placeholder
 * surfaces flag tasks that layer in via dedicated tickets
 * (CAPE prep, batch QA sign-off, entry list review).
 *
 * The eyebrow carries the literal state id so staff orient from
 * across the room — this is editorial-industrial mode, not a
 * SaaS pretty word.
 */

export interface WorkSurfaceProps {
  readonly caseId: string
  readonly state: CaseState
}

export function WorkSurface({ caseId, state }: WorkSurfaceProps) {
  return (
    <section className="flex flex-col border-x border-rule bg-paper p-6 sm:p-8">
      <p
        className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60"
        data-testid="work-surface-eyebrow"
      >
        {state}
      </p>
      {renderBody(caseId, state)}
    </section>
  )
}

function renderBody(caseId: string, state: CaseState) {
  switch (state) {
    case 'awaiting_docs':
    case 'entry_recovery_in_progress':
      return (
        <div data-testid="surface-extraction">
          <ExtractionFormPanel caseId={caseId} />
        </div>
      )
    case 'entry_list_ready':
      return (
        <div data-testid="surface-entry-list">
          <SurfaceCard
            heading="Entry list ready"
            body="Review the recovered entries before kicking off CAPE prep. Per-entry provenance lands in the right panel's Audit tab; editing lands with the entry-grid task."
          />
        </div>
      )
    case 'cape_prep_in_progress':
      return (
        <div data-testid="surface-cape-prep">
          <SurfaceCard
            heading="CAPE prep in progress"
            body="Run the validator, draft sign-off notes, and assemble the Readiness Report. The CAPE-prep workspace lands with its own task — this placeholder surfaces what stage the case is in."
          />
        </div>
      )
    case 'batch_qa':
      return (
        <div data-testid="surface-batch-qa">
          <SurfaceCard
            heading="Validator sign-off"
            body="Run the QA checklist, confirm zero blocking issues, enter a reviewer note, and sign off. The dedicated sign-off surface lands with its own task."
          />
        </div>
      )
    case 'submission_ready':
      return (
        <div data-testid="surface-submission-ready">
          <SurfaceCard
            heading="Ready for filing"
            body="The Readiness Report has been signed and the CSV is delivered to the customer. Watch for Stripe webhook activity + the customer's self-reported filing confirmation."
          />
        </div>
      )
    case 'concierge_active':
      return (
        <div data-testid="surface-concierge">
          <SurfaceCard
            heading="Concierge engagement"
            body="Coordination with the customer's broker is active. Log outreach + status notes here; surface audit events in the right panel."
          />
        </div>
      )
    case 'filed':
    case 'pending_cbp':
      return (
        <div data-testid="surface-pending-cbp">
          <SurfaceCard
            heading="Pending CBP review"
            body="Refund timing depends on CBP review. Log any CBP correspondence in the audit panel; escalate to `deficient` if CBP returns deficiency notices."
          />
        </div>
      )
    case 'deficient':
      return (
        <div data-testid="surface-deficient">
          <SurfaceCard
            heading="Deficiency response"
            body="CBP flagged a deficiency. Draft the customer response, confirm the corrective action, and re-submit once the fix is in place."
          />
        </div>
      )
    case 'stalled':
      return (
        <div data-testid="surface-stalled">
          <SurfaceCard
            heading="Case stalled"
            body="The case has been paused. Record the resume criterion in the reviewer note; the lifecycle workflow nudges the customer on the agreed cadence."
          />
        </div>
      )
    case 'paid':
    case 'closed':
    case 'disqualified':
      return (
        <div data-testid="surface-terminal">
          <SurfaceCard
            heading="Case closed"
            body="Read-only. The audit log remains accessible via the right panel; no further actions expected."
          />
        </div>
      )
    case 'new_lead':
    case 'qualified':
    case 'awaiting_purchase':
    case 'awaiting_prep_purchase':
    default:
      return (
        <div data-testid="surface-placeholder">
          <SurfaceCard
            heading="Pre-purchase / intake"
            body="The customer has not yet purchased the next product tier. The lifecycle cadence is nudging per PRD 05; surface manual outreach actions in the left panel when staff intervene."
          />
        </div>
      )
  }
}

function SurfaceCard({
  heading,
  body,
}: {
  heading: string
  body: string
}) {
  return (
    <article className="border border-rule bg-paper-2 p-6">
      <h2 className="font-display text-2xl tracking-display text-ink">
        {heading}
      </h2>
      <p className="mt-3 text-sm text-ink/80">{body}</p>
    </article>
  )
}
