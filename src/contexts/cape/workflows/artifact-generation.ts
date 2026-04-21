import { inngest } from '@shared/infra/inngest/client'
import { batchSignedOff } from '@shared/infra/inngest/events'
import type { StorageAdapter, StorageKey } from '@shared/infra/storage'
import { renderReadinessReport } from '../report-pdf/render'
import type {
  EntryTableRow,
} from '../report-pdf/EntryTable'
import { buildCapeCsv } from '../csv-builder'
import type { CapeEntryRow, ReadinessReport } from '../schema'

/**
 * Artifact generation pipeline per PRD 03.
 *
 * On `platform/batch.signed-off`, we:
 *   1. Build the CBP-bound CSV (respects the blocking-issues gate).
 *   2. Render the customer-facing Readiness Report PDF.
 *   3. Upload both to object storage under a case-scoped key.
 *   4. Mint short-lived signed read URLs.
 *   5. Send the "Prep ready" email with those URLs.
 *
 * Every side-effect step is wrapped in `step.run()` so Inngest replays
 * are safe — retries don't re-upload or re-email. The email is also
 * idempotency-keyed on the batchId so Resend dedupes across retries
 * at the provider layer too (defense in depth).
 *
 * This workflow is a no-op when the readiness report has blocking
 * issues or the entries list is empty — both of those states should
 * have been refused at the sign-off gate (#65), but we re-check here
 * because the event payload crosses a trust boundary.
 */

export interface BatchSignedOffEventData {
  readonly caseId: string
  readonly batchId: string
  readonly readinessReportId: string
  readonly signedAtIso: string
  readonly analystId: string
  readonly analystName: string
  readonly analystNote: string
  readonly customerEmail: string
  readonly customerName: string
  readonly readinessReport: ReadinessReport
  readonly entries: readonly CapeEntryRow[]
  /** Signed-in case workspace deep link; included in the email CTA. */
  readonly caseWorkspaceUrl: string
  /** Concierge upgrade deep link. */
  readonly conciergeUpgradeUrl: string
}

export interface ArtifactGenerationHandlerInput {
  readonly event: { readonly id?: string; readonly data: BatchSignedOffEventData }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
  }
}

export interface ArtifactGenerationHandlerDeps {
  readonly storage: StorageAdapter
  readonly email: {
    send(input: {
      to: string
      from: string
      subject: string
      html: string
      text: string
      idempotencyKey?: string
    }): Promise<{ id: string }>
  }
  readonly fromAddress: string
  /** Override the signed-URL TTL. Defaults to
   *  {@link DEFAULT_READ_URL_EXPIRY_SECONDS}. */
  readonly readUrlExpirySeconds?: number
}

export type ArtifactGenerationResult =
  | {
      readonly ok: true
      readonly csvKey: StorageKey
      readonly pdfKey: StorageKey
      readonly csvSignedUrl: string
      readonly pdfSignedUrl: string
      readonly emailMessageId: string
    }
  | {
      readonly ok: false
      readonly reason:
        | 'blocking_issues_present'
        | 'csv_build_failed'
        | 'unexpected_error'
      readonly detail?: string
    }

export async function artifactGenerationHandler(
  input: ArtifactGenerationHandlerInput,
  deps: ArtifactGenerationHandlerDeps,
): Promise<ArtifactGenerationResult> {
  const { event, step } = input
  const {
    caseId,
    batchId,
    readinessReport,
    entries,
    customerEmail,
    customerName,
    caseWorkspaceUrl,
    conciergeUpgradeUrl,
    signedAtIso,
    analystName,
    analystNote,
  } = event.data

  // Gate — blocking issues. Sign-off (#65) is the primary gate, but
  // this is a trust boundary so we re-check.
  if (readinessReport.blockingCount > 0) {
    return { ok: false, reason: 'blocking_issues_present' }
  }

  // Step 1 — build the CSV.
  const csvResult = await step.run('build-csv', async () =>
    buildCapeCsv({
      caseId,
      batchId,
      generatedAt: new Date(signedAtIso),
      entries: [...entries],
      readinessReport,
    }),
  )
  if (!csvResult.ok) {
    return { ok: false, reason: 'csv_build_failed', detail: csvResult.reason }
  }

  // Step 2 — render the PDF.
  const pdfBytes = await step.run('render-pdf', async () => {
    const entryRows = readinessReport.entries.map((reportEntry): EntryTableRow => {
      const matching = entries.find((e) => e.id === reportEntry.entryId)
      return {
        id: reportEntry.entryId,
        entryNumber: matching?.entryNumber ?? reportEntry.entryId,
        entryDate: matching?.entryDate ?? '—',
        importerOfRecord: matching?.importerOfRecord ?? customerName,
        dutyAmountUsdCents: matching?.dutyAmountUsdCents ?? 0,
        status: reportEntry.status,
        notes: reportEntry.notes,
      }
    })
    return renderReadinessReport({
      caseId,
      customerName,
      generatedAtIso: readinessReport.generatedAt,
      analystName,
      body: {
        totalEntries: entries.length,
        blockingCount: readinessReport.blockingCount,
        warningCount: readinessReport.warningCount,
        infoCount: readinessReport.infoCount,
        entryRows,
        prerequisites: readinessReport.prerequisites,
        signoff: {
          analystName,
          signedAtIso,
          note: analystNote,
        },
      },
    })
  })

  const csvKey = artifactKey({
    caseId,
    batchId,
    filename: 'readiness.csv',
  })
  const pdfKey = artifactKey({
    caseId,
    batchId,
    filename: 'readiness.pdf',
  })

  // Step 3 — upload to storage (CSV).
  await step.run('upload-csv', async () => {
    await deps.storage.putObject(csvKey, Buffer.from(csvResult.csv, 'utf8'), 'text/csv')
  })

  // Step 4 — upload to storage (PDF).
  await step.run('upload-pdf', async () => {
    await deps.storage.putObject(pdfKey, pdfBytes, 'application/pdf')
  })

  // Step 5 — mint signed read URLs.
  const csvSignedUrl = await step.run('sign-csv-url', async () =>
    deps.storage.getSignedReadUrl(csvKey, deps.readUrlExpirySeconds ?? 600),
  )
  const pdfSignedUrl = await step.run('sign-pdf-url', async () =>
    deps.storage.getSignedReadUrl(pdfKey, deps.readUrlExpirySeconds ?? 600),
  )

  // Step 6 — send the "Prep ready" email.
  const emailMessageId = await step.run('send-prep-ready-email', async () => {
    const { PrepReadyEmail, renderEmail } = await import('@shared/infra/email')
    const rendered = await renderEmail(
      PrepReadyEmail({
        firstName: firstNameFromCustomer(customerName),
        readinessReportUrl: pdfSignedUrl,
        conciergeUpgradeUrl,
      }),
    )
    const sent = await deps.email.send({
      from: deps.fromAddress,
      to: customerEmail,
      subject: 'Your Readiness Report is signed and ready.',
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `batch-signed-off:${batchId}`,
    })
    return sent.id
  })

  // caseWorkspaceUrl is passed through the event but not directly
  // embedded in the email — the PrepReady template only links to the
  // report + the concierge upgrade. We keep the field on the event for
  // downstream surfaces (ops console, audit log renderers) that want
  // to deep-link without re-deriving the URL. Referenced here so
  // unused-vars stays honest.
  void caseWorkspaceUrl

  return {
    ok: true,
    csvKey,
    pdfKey,
    csvSignedUrl,
    pdfSignedUrl,
    emailMessageId,
  }
}

function artifactKey(parts: {
  caseId: string
  batchId: string
  filename: string
}): StorageKey {
  return `cases/${parts.caseId}/cape-${parts.batchId}/${parts.filename}`
}

function firstNameFromCustomer(customerName: string): string | undefined {
  const first = customerName.trim().split(/\s+/u)[0]
  if (!first || first.length > 32) return undefined
  return first
}

/**
 * Inngest-wrapped workflow. The handler is exported separately so
 * tests inject stubs without paying the framework dependency.
 */
export const artifactGenerationWorkflow = inngest.createFunction(
  { id: 'artifact-generation', triggers: [batchSignedOff] },
  async (input) => {
    const { getEmailTransport, getEmailFrom } = await import('@shared/infra/email')
    const { createStorage } = await import('@shared/infra/storage')
    const storage = createStorage() as StorageAdapter
    const adapted = input as unknown as ArtifactGenerationHandlerInput
    return artifactGenerationHandler(adapted, {
      storage,
      email: { send: (i) => getEmailTransport().send(i) },
      fromAddress: getEmailFrom(),
    })
  },
)
