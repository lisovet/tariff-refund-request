import type { CaseRepo } from '@contexts/ops'
import type { IdentityRepo } from '../repo'

/**
 * Data-rights services per PRD 10 §Acceptance criteria:
 *
 *   "Given a customer requests deletion, when processed, all
 *    in-scope records are purged within 30 days and the audit log
 *    records the event."
 *
 * v1 scope: customer identity + cases + audit rows. Downstream
 * satellites (documents, entries, payments) layer in as their
 * contexts surface repo support.
 */

/**
 * Per PRD 10 §Retention: deletion SLA is 30 calendar days.
 * Encoded as a constant so the worker + UI copy both read from the
 * same number.
 */
export const DELETION_SLA_DAYS = 30

export const DELETION_REQUEST_STATUSES = [
  'queued',
  'processed',
  'cancelled',
] as const
export type DeletionRequestStatus = (typeof DELETION_REQUEST_STATUSES)[number]

export interface DeletionRequest {
  readonly id: string
  readonly customerId: string
  readonly requestedAt: Date
  readonly scheduledFor: Date
  readonly reason: string
  readonly status: DeletionRequestStatus
  readonly processedAt: Date | null
}

export interface RequestCustomerDeletionInput {
  readonly customerId: string
  readonly reason: string
}

export interface DeletionRepo {
  enqueue(input: {
    customerId: string
    requestedAt: Date
    scheduledFor: Date
    reason: string
  }): Promise<{ request: DeletionRequest; replay: boolean }>
  markProcessed(id: string, processedAt: Date): Promise<DeletionRequest | undefined>
  listByStatus(status: DeletionRequestStatus): Promise<readonly DeletionRequest[]>
  findByCustomer(customerId: string): Promise<DeletionRequest | undefined>
}

/**
 * Content-free deletion-log payload written to whatever global
 * audit sink the caller provides (typically an Axiom logger).
 * Intentionally no PII — counts only + the deletion request id.
 */
export interface GlobalAuditSinkInput {
  readonly kind: 'customer.deleted'
  readonly customerId: string
  readonly deletionRequestId: string
  readonly occurredAt: Date
  readonly counts: {
    readonly casesDeleted: number
    readonly auditRowsDeleted: number
  }
}

export type GlobalAuditSink = (
  input: GlobalAuditSinkInput,
) => Promise<string>

export interface ExportCustomerDataInput {
  readonly customerId: string
}

export interface CustomerExport {
  readonly exportedAt: string
  readonly customer: {
    readonly id: string
    readonly email: string
    readonly fullName: string | null
    readonly createdAt: string
  }
  readonly cases: readonly {
    readonly id: string
    readonly state: string
    readonly tier: string
    readonly createdAt: string
    readonly updatedAt: string
    readonly auditEntries: readonly {
      readonly id: string
      readonly kind: string
      readonly actorId: string | null
      readonly fromState: string | null
      readonly toState: string | null
      readonly occurredAt: string
      readonly payload: unknown
    }[]
  }[]
}

export type ExportCustomerDataResult =
  | { readonly ok: true; readonly export: CustomerExport }
  | { readonly ok: false; readonly reason: 'customer_not_found' }

export interface ExportCustomerDataDeps {
  readonly identityRepo: IdentityRepo
  readonly caseRepo: CaseRepo
}

export interface RequestCustomerDeletionDeps {
  readonly deletionRepo: DeletionRepo
  readonly clock: () => Date
}

export interface ProcessPendingDeletionsDeps {
  readonly deletionRepo: DeletionRepo
  readonly caseRepo: CaseRepo
  readonly identityRepo: IdentityRepo
  readonly globalAuditSink: GlobalAuditSink
}
