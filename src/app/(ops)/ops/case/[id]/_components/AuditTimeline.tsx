import type { CaseState } from '@contexts/ops'

/**
 * AuditTimeline — right-pane audit-log viewer per PRD 04.
 *
 * Pure read of `audit_log` via a serialized shape the server page
 * passes through (Date → ISO, payload → unknown). Rows render in
 * chronological order with the state-transition pair `from → to`
 * when applicable, mono actor id, mono timestamp, and a secondary
 * line for well-known payload shapes (admin.note, customer.deleted).
 *
 * Non-transition rows do NOT render the arrow separator — the
 * visual rhythm stays consistent across mixed audit streams.
 */

export interface AuditTimelineEntry {
  readonly id: string
  readonly kind: string
  readonly actorId: string | null
  readonly fromState: CaseState | null
  readonly toState: CaseState | null
  readonly occurredAtIso: string
  readonly payload: unknown
}

export interface AuditTimelineProps {
  readonly entries: readonly AuditTimelineEntry[]
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Audit log
        </p>
        <p className="mt-3 text-sm italic text-ink/70">
          No audit events yet for this case.
        </p>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) =>
    a.occurredAtIso.localeCompare(b.occurredAtIso),
  )

  return (
    <div className="p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
        Audit log ({sorted.length})
      </p>
      <ol className="space-y-4">
        {sorted.map((e) => (
          <li
            key={e.id}
            data-testid="audit-row"
            data-audit-id={e.id}
            className="border-l-2 border-rule pl-4"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/60">
                {formatTs(e.occurredAtIso)}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink">
                {e.kind}
              </span>
              {e.fromState && e.toState ? (
                <span className="font-mono text-xs text-ink/70">
                  <span>{e.fromState}</span>{' '}
                  <span aria-hidden="true">→</span>{' '}
                  <span>{e.toState}</span>
                </span>
              ) : null}
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/60">
                by {e.actorId ?? 'system'}
              </span>
            </div>
            <SecondaryLine entry={e} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function SecondaryLine({ entry }: { entry: AuditTimelineEntry }) {
  const p = entry.payload
  if (!p || typeof p !== 'object') return null

  // admin.note → render `note` field verbatim.
  if (entry.kind === 'admin.note' || entry.kind === 'qa.sign_off') {
    const note = (p as { note?: string }).note
    if (typeof note === 'string' && note.length > 0) {
      return <p className="mt-1 text-sm text-ink/80">{note}</p>
    }
  }

  // customer.deleted → render counts (never PII — payload is already
  // content-free by contract).
  if (entry.kind === 'customer.deleted') {
    const counts = (p as { counts?: { casesDeleted?: number; auditRowsDeleted?: number } }).counts
    if (counts) {
      return (
        <p className="mt-1 font-mono text-xs text-ink/70">
          {counts.casesDeleted ?? 0} cases · {counts.auditRowsDeleted ?? 0} audit rows removed
        </p>
      )
    }
  }

  return null
}

function formatTs(iso: string): string {
  // Editorial: "2026-04-21 13:00 UTC"
  const date = iso.slice(0, 10)
  const time = iso.slice(11, 16)
  return `${date} ${time} UTC`
}
