import Link from 'next/link'
import type { QueueRow } from '@contexts/ops'

/**
 * QueueTable — dense, editorial-industrial table for the ops
 * console. Berkeley-Mono-inspired (FONT_MONO) columns for id + age;
 * state chip; row → link to /ops/case/[id].
 *
 * Rows with an SLA breach render a severe accent in the age
 * cell — the signal has to read from across the room.
 */

export interface QueueTableProps {
  readonly rows: readonly QueueRow[]
}

export function QueueTable({ rows }: QueueTableProps) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-ink/60 sm:px-10">
        <p className="font-mono uppercase tracking-[0.2em]">Queue empty</p>
        <p className="mt-1">
          No cases match the current filter. Clear filters or pick a
          different saved view.
        </p>
      </div>
    )
  }

  return (
    <table className="w-full border-collapse text-left text-sm" data-testid="queue-table">
      <thead>
        <tr className="border-b border-rule">
          <th className="px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60 sm:px-10">
            Case
          </th>
          <th className="px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
            State
          </th>
          <th className="px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
            Tier
          </th>
          <th className="px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
            Owner
          </th>
          <th className="px-6 py-3 text-right font-mono text-xs uppercase tracking-[0.2em] text-ink/60 sm:px-10">
            Age
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-b border-rule last:border-0 hover:bg-paper-2"
            data-case-id={r.id}
            data-sla-breach={r.isSlaBreach ? 'true' : 'false'}
          >
            <td className="px-6 py-3 font-mono text-xs sm:px-10">
              <Link
                href={`/ops/case/${r.id}`}
                className="text-ink underline-offset-[6px] hover:underline decoration-ink/40"
              >
                {r.id}
              </Link>
            </td>
            <td className="px-6 py-3">
              <span className="inline-block border border-rule bg-paper px-2 py-0.5 font-mono text-xs uppercase tracking-[0.15em] text-ink/80">
                {r.state}
              </span>
            </td>
            <td className="px-6 py-3 font-mono text-xs uppercase tracking-[0.1em] text-ink/70">
              {r.tier}
            </td>
            <td className="px-6 py-3 font-mono text-xs text-ink/80">
              {r.ownerStaffId ?? (
                <span className="text-warning">unassigned</span>
              )}
            </td>
            <td
              className={`px-6 py-3 text-right font-mono text-xs sm:px-10 ${
                r.isSlaBreach ? 'text-blocking' : 'text-ink/80'
              }`}
              data-age-ms={r.ageMs}
            >
              {r.ageHumanized}
              {r.isSlaBreach ? (
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.15em] text-blocking">
                  SLA
                </span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
