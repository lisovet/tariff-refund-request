import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'
import {
  determineRecoveryPath,
  recoveryPlanFor,
  renderOutreachKit,
  HUMAN_LABEL_FOR_KIND,
  type OutreachKitTokens,
} from '@contexts/recovery'
import { getCaseRepo } from '@contexts/ops/server'
import { getDocumentRepo } from '@contexts/recovery/server'
import { getScreenerRepo } from '@contexts/screener/server'
import { OutreachKitPanel } from './_components/OutreachKitPanel'
import { RecoveryStatusPanel, type UploadedDocSummary } from './_components/RecoveryStatusPanel'
import { UploadPanel } from './_components/UploadPanel'

/**
 * /app/case/[id]/recovery — customer recovery workspace per PRD 02.
 *
 * Three-pane layout:
 *   Left   — case status banner + document checklist + prerequisites.
 *   Center — outreach kit (rendered email + copy-to-clipboard).
 *   Right  — secure upload zone (delegates to UploadZone).
 *
 * The page resolves the recovery path by reading the screener
 * answers off the case's screener_session and running
 * determineRecoveryPath. UI never branches on `path` — that lives
 * inside the recovery plan + the outreach template registry per
 * ADR 015.
 *
 * Auth: middleware enforces a session for /app routes. Customer-to-
 * case ownership scoping lands with the lifecycle workflow that
 * creates the case (#52). For now any authenticated user reaching
 * this URL with a valid id sees the workspace — this is fine for
 * scaffolding; the security gate is a follow-up.
 */

interface PageProps {
  readonly params: Promise<{ id: string }>
}

const TOKEN_DEFAULTS = {
  brokerName: 'your broker',
  windowStart: '2024-04-01',
  windowEnd: '2024-12-31',
} as const

export const dynamic = 'force-dynamic'

export default async function RecoveryWorkspacePage({
  params,
}: PageProps): Promise<ReactElement> {
  const { id } = await params

  const caseRecord = await getCaseRepo().findCase(id)
  if (!caseRecord) notFound()

  const session = caseRecord.screenerSessionId
    ? await getScreenerRepo().findSessionById(caseRecord.screenerSessionId)
    : null

  const path = session ? determineRecoveryPath(session.answers) : null
  if (!path) {
    // Case exists but has no clear recovery path (no screener session,
    // or disqualified). Surface as 404 — workspace doesn't apply.
    notFound()
  }

  const plan = recoveryPlanFor(path)

  const tokens: OutreachKitTokens = {
    importerName: importerNameFor(session?.answers, caseRecord.id),
    brokerName: TOKEN_DEFAULTS.brokerName,
    windowStart: TOKEN_DEFAULTS.windowStart,
    windowEnd: TOKEN_DEFAULTS.windowEnd,
  }
  const kit = renderOutreachKit(path, tokens)

  const documents = await getDocumentRepo().listDocumentsForCase(caseRecord.id)
  const uploaded: readonly UploadedDocSummary[] = documents.map((d) => ({
    id: d.id,
    filename: d.filename,
    uploadedAtIso: d.createdAt.toISOString(),
  }))

  const attachmentsNeeded = plan.acceptedDocs.map(
    (kind) => HUMAN_LABEL_FOR_KIND[kind],
  )

  return (
    <main className="min-h-screen bg-paper">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px]">
        <RecoveryStatusPanel
          caseId={caseRecord.id}
          plan={plan}
          uploaded={uploaded}
        />
        <OutreachKitPanel kit={kit} attachmentsNeeded={attachmentsNeeded} />
        <UploadPanel caseId={caseRecord.id} />
      </div>
    </main>
  )
}

function importerNameFor(
  answers: { q10?: { company?: string } } | undefined,
  fallbackCaseId: string,
): string {
  const company = answers?.q10?.company?.trim()
  if (company && company.length > 0) return company
  return `Customer ${fallbackCaseId}`
}
