import type { ReactNode } from 'react'

/**
 * Anchored status banner for every authenticated page. Per PRD 04 +
 * docs/DESIGN-LANGUAGE.md: case ID in mono, status in accent or
 * status-color, next action as a real link (magazine underline),
 * never collapsible.
 */

type Severity = 'info' | 'positive' | 'warning' | 'blocking'

interface Props {
  readonly caseId: string
  readonly status: string
  readonly nextAction: { readonly label: string; readonly href: string }
  readonly severity?: Severity
  readonly children?: ReactNode
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  info: 'text-accent',
  positive: 'text-positive',
  warning: 'text-warning',
  blocking: 'text-blocking',
}

export function StatusBanner({
  caseId,
  status,
  nextAction,
  severity = 'info',
}: Props) {
  return (
    <section
      role="region"
      aria-label="Case status"
      className="border-b border-rule bg-paper-2 px-6 py-3 sm:px-10"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/60">
            Case
          </span>
          <span className="font-mono text-sm text-ink">{caseId}</span>
        </div>

        <div className="flex items-baseline gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/60">
            Status
          </span>
          <span
            className={`font-mono text-sm uppercase tracking-[0.1em] ${SEVERITY_CLASSES[severity]}`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-baseline gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/60">
            Next
          </span>
          <a
            href={nextAction.href}
            className="text-sm text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
          >
            {nextAction.label} →
          </a>
        </div>
      </div>
    </section>
  )
}
