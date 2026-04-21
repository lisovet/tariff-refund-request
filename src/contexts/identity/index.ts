/**
 * Identity context — public surface. Per ADR 001, callers import from
 * `@contexts/identity` (not from individual files inside).
 *
 * Provides:
 *   - IdentityRepo contract (drizzle + in-memory implementations)
 *   - handleClerkEvent — Clerk webhook dispatcher
 *   - getIdentityRepo — factory chooses drizzle vs in-memory based on env
 */

export type {
  CustomerRecord,
  StaffUserRecord,
  IdentityRepo,
  UpsertCustomerInput,
  UpsertStaffUserInput,
} from './repo'

export { createInMemoryIdentityRepo } from './in-memory-repo'
export { createDrizzleIdentityRepo } from './drizzle-repo'
export { handleClerkEvent, type ClerkWebhookEvent } from './sync'

export {
  DELETION_SLA_DAYS,
  DELETION_REQUEST_STATUSES,
  createInMemoryDeletionRepo,
  exportCustomerData,
  processPendingDeletions,
  requestCustomerDeletion,
  type CustomerExport,
  type DeletionRepo,
  type DeletionRequest,
  type DeletionRequestStatus,
  type ExportCustomerDataDeps,
  type ExportCustomerDataInput,
  type ExportCustomerDataResult,
  type GlobalAuditSink,
  type GlobalAuditSinkInput,
  type ProcessOneResult,
  type ProcessPendingDeletionsDeps,
  type ProcessPendingDeletionsResult,
  type RequestCustomerDeletionDeps,
  type RequestCustomerDeletionInput,
} from './data-rights'

import { createDbClient } from '@shared/infra/db/client'
import { createDrizzleIdentityRepo } from './drizzle-repo'
import { createInMemoryIdentityRepo } from './in-memory-repo'
import type { IdentityRepo } from './repo'

let cached: IdentityRepo | undefined

/**
 * Returns the identity repo for the current environment. DATABASE_URL
 * present → Drizzle; missing → in-memory (dev fallback). Cached
 * per-process; reset via resetIdentityRepo() in tests.
 */
export function getIdentityRepo(): IdentityRepo {
  if (cached) return cached
  if (process.env.DATABASE_URL) {
    cached = createDrizzleIdentityRepo(createDbClient())
  } else {
    cached = createInMemoryIdentityRepo()
  }
  return cached
}

export function resetIdentityRepo(): void {
  cached = undefined
}
