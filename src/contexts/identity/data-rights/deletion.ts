import {
  DELETION_SLA_DAYS,
  type DeletionRequest,
  type ProcessPendingDeletionsDeps,
  type RequestCustomerDeletionDeps,
  type RequestCustomerDeletionInput,
} from './types'

/**
 * Request + worker per PRD 10 §Your rights / Acceptance criteria.
 *
 * `requestCustomerDeletion` queues a deletion, idempotent per
 * customer. `processPendingDeletions` is the worker:
 *
 *   1. Picks every queued request whose `scheduledFor` has arrived.
 *   2. Purges owned cases + their audit rows.
 *   3. Purges the customer row.
 *   4. Writes a content-free deletion-log row to the global audit
 *      sink (counts + ids, no PII).
 *   5. Marks the request `processed`.
 *
 * The worker is idempotent. A re-run after processing completes
 * does nothing.
 */

export async function requestCustomerDeletion(
  input: RequestCustomerDeletionInput,
  deps: RequestCustomerDeletionDeps,
): Promise<{ request: DeletionRequest; replay: boolean }> {
  const now = deps.clock()
  const scheduledFor = new Date(
    now.getTime() + DELETION_SLA_DAYS * 24 * 60 * 60 * 1000,
  )
  return deps.deletionRepo.enqueue({
    customerId: input.customerId,
    requestedAt: now,
    scheduledFor,
    reason: input.reason,
  })
}

export interface ProcessOneResult {
  readonly ok: boolean
  readonly requestId: string
  readonly customerId: string
  readonly casesDeleted: number
  readonly auditRowsDeleted: number
  readonly customerDeleted: boolean
}

export interface ProcessPendingDeletionsResult {
  readonly processedCount: number
  readonly results: readonly ProcessOneResult[]
}

export async function processPendingDeletions(
  now: Date,
  deps: ProcessPendingDeletionsDeps,
): Promise<ProcessPendingDeletionsResult> {
  const queued = await deps.deletionRepo.listByStatus('queued')
  const due = queued.filter((r) => r.scheduledFor.getTime() <= now.getTime())

  const results: ProcessOneResult[] = []
  for (const r of due) {
    const owned = await deps.caseRepo.listCasesByCustomer(r.customerId)
    let auditRowsDeleted = 0
    let casesDeleted = 0
    for (const c of owned) {
      const { auditRowsRemoved } = await deps.caseRepo.deleteCaseAndAudit(c.id)
      auditRowsDeleted += auditRowsRemoved
      casesDeleted += 1
    }
    const { deleted: customerDeleted } = await deps.identityRepo.deleteCustomer(
      r.customerId,
    )

    // Content-free audit row — counts + ids, no PII.
    await deps.globalAuditSink({
      kind: 'customer.deleted',
      customerId: r.customerId,
      deletionRequestId: r.id,
      occurredAt: now,
      counts: { casesDeleted, auditRowsDeleted },
    })

    await deps.deletionRepo.markProcessed(r.id, now)

    results.push({
      ok: true,
      requestId: r.id,
      customerId: r.customerId,
      casesDeleted,
      auditRowsDeleted,
      customerDeleted,
    })
  }

  return { processedCount: results.length, results }
}
