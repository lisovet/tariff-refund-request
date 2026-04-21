import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'
import { getCaseRepo } from '@contexts/ops/server'
import {
  determineRecoveryPath,
  recoveryPlanFor,
} from '@contexts/recovery'
import { getDocumentRepo } from '@contexts/recovery/server'
import { getScreenerRepo } from '@contexts/screener/server'
import type { AuditTimelineEntry } from './_components/AuditTimeline'
import { CaseHeaderPanel } from './_components/CaseHeaderPanel'
import { CaseSidePanel } from './_components/CaseSidePanel'
import type { CaseDocumentSummary } from './_components/DocumentViewerPanel'
import { WorkSurface } from './_components/WorkSurface'

/**
 * /ops/case/[id] — staff-side three-pane case workspace per PRD 04.
 *
 *   Left   — CaseHeaderPanel: case id, state pill, tier, owner, queue,
 *            SLA, action panel (claim / mark stalled stubs).
 *   Center — ExtractionFormPanel: entry-extraction form (local state
 *            at v1; persistence with the entries schema #55+).
 *   Right  — DocumentViewerPanel: doc list + the existing
 *            DocumentViewer for the focused PDF.
 *
 * Auth: middleware enforces /ops requires a staff role. Finer
 * per-case ownership scoping (analyst can only see claimed cases,
 * etc.) lands with the queue page (#82+).
 */

interface PageProps {
  readonly params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function OpsCasePage({
  params,
}: PageProps): Promise<ReactElement> {
  const { id } = await params

  const caseRecord = await getCaseRepo().findCase(id)
  if (!caseRecord) notFound()

  const session = caseRecord.screenerSessionId
    ? await getScreenerRepo().findSessionById(caseRecord.screenerSessionId)
    : null

  const path = session ? determineRecoveryPath(session.answers) : null
  if (!path) notFound()
  const plan = recoveryPlanFor(path)

  const documents = await getDocumentRepo().listDocumentsForCase(caseRecord.id)
  const docSummaries: readonly CaseDocumentSummary[] = documents.map((d) => ({
    id: d.id,
    filename: d.filename,
    storageKey: d.storageKey,
    // Real signed read URLs land with the ops-console plumbing in
    // task #82+; v1 surfaces the storage key for QA.
  }))

  const rawAudit = await getCaseRepo().listAudit(caseRecord.id)
  const auditEntries: readonly AuditTimelineEntry[] = rawAudit.map((a) => ({
    id: a.id,
    kind: a.kind,
    actorId: a.actorId,
    fromState: a.fromState,
    toState: a.toState,
    occurredAtIso: a.occurredAt.toISOString(),
    payload: a.payload,
  }))

  return (
    <main className="min-h-screen bg-paper">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_minmax(360px,1fr)]">
        <CaseHeaderPanel caseRecord={caseRecord} plan={plan} />
        <WorkSurface caseId={caseRecord.id} state={caseRecord.state} />
        <CaseSidePanel
          caseId={caseRecord.id}
          documents={docSummaries}
          auditEntries={auditEntries}
        />
      </div>
    </main>
  )
}
