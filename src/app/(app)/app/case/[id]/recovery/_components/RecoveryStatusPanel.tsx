import {
  type RecoveryPath,
  type RecoveryPlan,
  HUMAN_LABEL_FOR_KIND,
} from '@contexts/recovery'

/**
 * Left pane of the recovery workspace per PRD 02. Anchored status
 * banner + checklist of documents requested / received / missing,
 * plus prerequisite checks pulled from the recovery plan.
 *
 * Reads directly from the plan — no path-conditionals here per
 * ADR 015 ("no-recovery-path-conditionals").
 */

const PATH_LABEL: Readonly<Record<RecoveryPath, string>> = {
  broker: 'Broker recovery',
  carrier: 'Carrier recovery',
  'ace-self-export': 'ACE portal recovery',
  mixed: 'Mixed recovery',
}

export interface UploadedDocSummary {
  readonly id: string
  readonly filename: string
  readonly uploadedAtIso: string
}

export interface RecoveryStatusPanelProps {
  readonly caseId: string
  readonly plan: RecoveryPlan
  readonly uploaded: readonly UploadedDocSummary[]
}

export function RecoveryStatusPanel({
  caseId,
  plan,
  uploaded,
}: RecoveryStatusPanelProps) {
  const remaining = Math.max(0, plan.acceptedDocs.length - uploaded.length)

  return (
    <aside
      aria-label="Case status and checklist"
      className="border-r border-rule p-6 sm:p-8"
    >
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
          Case
        </p>
        <p className="font-mono text-sm text-ink" data-testid="case-id">
          {caseId}
        </p>
      </div>

      <div
        role="status"
        data-testid="status-banner"
        className="mt-8 border border-rule p-4"
      >
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          {PATH_LABEL[plan.path]}
        </p>
        <p className="mt-3 text-sm text-ink/85">
          Upload your documents to get started. We&rsquo;ll email you when
          your entries are validated — first response within{' '}
          <span className="font-mono">{plan.sla.firstTouchHours}h</span>, full
          turnaround within{' '}
          <span className="font-mono">{plan.sla.completionHours}h</span> after
          documents land.
        </p>
      </div>

      <div className="mt-10">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
          Document checklist
        </h3>
        <ul
          aria-label="Document checklist"
          className="mt-4 divide-y divide-rule border-y border-rule"
        >
          {plan.acceptedDocs.map((kind) => (
            <li
              key={kind}
              data-testid={`checklist-row-${kind}`}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span className="text-sm text-ink/85">
                {HUMAN_LABEL_FOR_KIND[kind]}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink/55">
                Accepted
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-xs text-ink/55">
          {uploaded.length} uploaded · {remaining} more accepted
        </p>
      </div>

      <div className="mt-10">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
          Prerequisites
        </h3>
        <ul
          aria-label="Prerequisite checks"
          className="mt-4 space-y-2"
        >
          {plan.prerequisiteChecks.map((check) => (
            <li
              key={check.id}
              data-testid={`prereq-${check.id}`}
              data-required={check.required}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="text-sm text-ink/85">{check.label}</span>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink/55">
                {check.required ? 'Required' : 'Optional'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {uploaded.length > 0 && (
        <div className="mt-10">
          <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
            Uploaded
          </h3>
          <ul
            aria-label="Uploaded documents"
            className="mt-4 divide-y divide-rule border-y border-rule"
            data-testid="uploaded-list"
          >
            {uploaded.map((doc) => (
              <li
                key={doc.id}
                className="flex items-baseline justify-between gap-4 py-3 font-mono text-xs"
              >
                <span className="truncate text-ink">{doc.filename}</span>
                <span className="text-ink/55">{formatTime(doc.uploadedAtIso)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function formatTime(iso: string): string {
  // Render a stable, no-locale timestamp so SSR + client don't disagree.
  // The display is mono numerics; the `Z` suffix is intentional.
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().replace('T', ' ').slice(0, 16) + 'Z'
}
