import { processedStripeEvents } from './schema/billing'
import { auditLog, cases } from './schema/cases'
import { documents, recoverySources } from './schema/documents'
import { customers, staffUsers } from './schema/identity'
import { leads, screenerSessions } from './schema/screener'

/**
 * Drizzle schema registry. Downstream tasks register tables here as they
 * land (documents + recovery_sources in task #44, entries in task #55,
 * etc.).
 *
 * Per ADR 003, this module is the single source of schema truth for the
 * platform. drizzle-kit reads from here to generate migrations.
 */

export const schema = {
  tables: {
    customers,
    staffUsers,
    screenerSessions,
    leads,
    processedStripeEvents,
    cases,
    auditLog,
    documents,
    recoverySources,
  },
} as const

export type Schema = typeof schema

// Re-export tables for direct use by drizzle queries.
export {
  customers,
  staffUsers,
  screenerSessions,
  leads,
  processedStripeEvents,
  cases,
  auditLog,
  documents,
  recoverySources,
}
export type { CustomerRow, StaffUserRow } from './schema/identity'
export type { ScreenerSessionRow, LeadRow } from './schema/screener'
export type { ProcessedStripeEventRow } from './schema/billing'
export type {
  CaseRow,
  NewCaseRow,
  AuditLogRow,
  NewAuditLogRow,
  CaseState,
} from './schema/cases'
export { CASE_STATES } from './schema/cases'
export type {
  DocumentRow,
  NewDocumentRow,
  RecoverySourceRow,
  NewRecoverySourceRow,
  DocumentUploader,
  RecoveryPath,
  DocumentKind,
  RecoverySourceConfidence,
} from './schema/documents'
export {
  DOCUMENT_UPLOADERS,
  DOCUMENT_KINDS,
  RECOVERY_PATHS,
  RECOVERY_SOURCE_CONFIDENCES,
} from './schema/documents'
