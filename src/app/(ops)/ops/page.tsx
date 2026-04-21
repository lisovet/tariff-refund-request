import Link from 'next/link'
import {
  SAVED_VIEWS,
  computeQueueRow,
  filterQueue,
  resolveSavedView,
  type CaseState,
  type QueueFilter,
} from '@contexts/ops'
import { getCaseRepo } from '@contexts/ops/server'
import { resolveCurrentActor } from '@shared/infra/auth/resolver'
import { requireStaff } from '@shared/infra/auth/require'
import { QueueTable } from './_components/QueueTable'

/**
 * Ops console queue — /ops per PRD 04.
 *
 * Server-rendered list of every case with the queue-critical
 * facets (state, tier, owner, age, SLA breach). Staff-only —
 * middleware gates /ops/** to the Clerk org; this page additionally
 * calls `requireStaff()` so anonymous / customer actors see 403.
 *
 * Query params drive filtering:
 *   ?view=<saved-view-id>  — one of SAVED_VIEWS
 *   ?state=<state>         — single-state filter
 *   ?owner=<stf_id|null>   — owner / unassigned
 *
 * View-scoped filter wins over ad-hoc ?state / ?owner — saved
 * views are intentionally stable, shareable URLs.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  readonly searchParams?: Promise<{
    readonly view?: string
    readonly state?: string
    readonly owner?: string
  }>
}

export default async function OpsQueuePage({ searchParams }: PageProps) {
  const actor = requireStaff(await resolveCurrentActor())
  const params = (await searchParams) ?? {}

  const filter = buildFilter(params, actor.id)

  const repo = getCaseRepo()
  const allCases = await repo.listCases()
  const filtered = filterQueue(allCases, filter)

  const now = new Date()
  const rows = filtered.map((c) => computeQueueRow(c, now))

  return (
    <main className="bg-paper text-ink">
      <header className="border-b border-rule px-6 py-6 sm:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Queue
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-display">
          Cases in flight
        </h1>
        <p className="mt-2 font-mono text-xs text-ink/70">
          {rows.length} / {allCases.length} cases
        </p>
      </header>

      <nav
        aria-label="Saved views"
        className="flex flex-wrap gap-2 border-b border-rule px-6 py-4 sm:px-10"
      >
        <SavedViewLink
          id="__all"
          label="All"
          current={params.view}
          href="/ops"
        />
        {SAVED_VIEWS.map((v) => (
          <SavedViewLink
            key={v.id}
            id={v.id}
            label={v.label}
            current={params.view}
            href={`/ops?view=${encodeURIComponent(v.id)}`}
          />
        ))}
      </nav>

      <QueueTable rows={rows} />
    </main>
  )
}

function buildFilter(
  params: { view?: string; state?: string; owner?: string },
  staffId: string,
): QueueFilter {
  if (params.view) {
    const resolved = resolveSavedView(params.view, { staffId })
    if (resolved) return resolved
  }
  const filter: QueueFilter = {}
  if (params.state) {
    return { ...filter, states: [params.state as CaseState] }
  }
  if (params.owner === 'null') {
    return { ...filter, ownerStaffId: null }
  }
  if (params.owner) {
    return { ...filter, ownerStaffId: params.owner }
  }
  return filter
}

function SavedViewLink({
  id,
  label,
  current,
  href,
}: {
  id: string
  label: string
  current: string | undefined
  href: string
}) {
  const active = (current ?? '__all') === id
  const className = active
    ? 'border border-ink bg-ink px-3 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-paper'
    : 'border border-rule bg-paper px-3 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink hover:bg-paper-2'
  return (
    <Link href={href} className={className} data-view-id={id}>
      {label}
    </Link>
  )
}
