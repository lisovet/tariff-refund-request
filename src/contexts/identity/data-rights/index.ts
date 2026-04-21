/**
 * Data-rights public surface — customer export + deletion
 * services per PRD 10.
 */

export {
  DELETION_SLA_DAYS,
  DELETION_REQUEST_STATUSES,
  type CustomerExport,
  type DeletionRepo,
  type DeletionRequest,
  type DeletionRequestStatus,
  type ExportCustomerDataDeps,
  type ExportCustomerDataInput,
  type ExportCustomerDataResult,
  type GlobalAuditSink,
  type GlobalAuditSinkInput,
  type ProcessPendingDeletionsDeps,
  type RequestCustomerDeletionDeps,
  type RequestCustomerDeletionInput,
} from './types'

export { createInMemoryDeletionRepo } from './in-memory-deletion-repo'
export { exportCustomerData } from './export'
export {
  requestCustomerDeletion,
  processPendingDeletions,
  type ProcessOneResult,
  type ProcessPendingDeletionsResult,
} from './deletion'
