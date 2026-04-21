import { sql } from 'drizzle-orm'
import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { cases } from './cases'

/**
 * documents — every uploaded artifact, immutable. New versions are
 * separate rows linked via supersedesId so we keep an auditable
 * lineage. Per ADR 006: storage_key is case-scoped
 * (cases/{caseId}/{documentId}/{filename}); the UNIQUE constraint
 * pins one row per object in the bucket.
 *
 * recovery_sources — the provenance layer per PRD 02. Each entry
 * recovered from a document references the source via documentId;
 * confidence reflects analyst review (pending → verified | rejected).
 *
 * Per the NOT NULL provenance rule from .ralph/PROMPT.md: every
 * EntryRecord (added in task #55) must reference at least one
 * recovery_sources row. Schema enforces NOT NULL on that side.
 */

export const DOCUMENT_UPLOADERS = ['customer', 'staff', 'system'] as const
export type DocumentUploader = (typeof DOCUMENT_UPLOADERS)[number]

export const documents = pgTable(
  'documents',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'doc_' || encode(gen_random_bytes(12), 'hex')`),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'restrict' }),
    storageKey: text('storage_key').notNull(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    sha256: text('sha256').notNull(),
    uploadedBy: text('uploaded_by', { enum: DOCUMENT_UPLOADERS }).notNull(),
    uploadedByActorId: text('uploaded_by_actor_id'),
    version: bigint('version', { mode: 'number' }).notNull().default(1),
    supersedesId: text('supersedes_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    storageKeyUnique: unique('documents_storage_key_unique').on(t.storageKey),
    caseShaUnique: unique('documents_case_sha256_unique').on(t.caseId, t.sha256),
    byCase: index('documents_case_idx').on(t.caseId, t.createdAt),
  }),
)

export const RECOVERY_PATHS = [
  'broker',
  'carrier',
  'ace_self_export',
  'mixed',
] as const
export type RecoveryPath = (typeof RECOVERY_PATHS)[number]

export const DOCUMENT_KINDS = [
  'ace_export',
  'broker_7501',
  'broker_spreadsheet',
  'carrier_invoice',
  'paper_scan',
  'other',
] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export const RECOVERY_SOURCE_CONFIDENCES = [
  'pending',
  'verified',
  'rejected',
] as const
export type RecoverySourceConfidence = (typeof RECOVERY_SOURCE_CONFIDENCES)[number]

export const recoverySources = pgTable(
  'recovery_sources',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'rsrc_' || encode(gen_random_bytes(12), 'hex')`),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'restrict' }),
    path: text('path', { enum: RECOVERY_PATHS }).notNull(),
    kind: text('kind', { enum: DOCUMENT_KINDS }).notNull(),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'restrict' }),
    uploadedBy: text('uploaded_by', { enum: DOCUMENT_UPLOADERS }).notNull(),
    uploadedByActorId: text('uploaded_by_actor_id'),
    confidence: text('confidence', { enum: RECOVERY_SOURCE_CONFIDENCES })
      .notNull()
      .default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byCase: index('recovery_sources_case_idx').on(t.caseId, t.createdAt),
    byDocument: index('recovery_sources_document_idx').on(t.documentId),
    byConfidence: index('recovery_sources_confidence_idx').on(t.confidence),
  }),
)

export type DocumentRow = typeof documents.$inferSelect
export type NewDocumentRow = typeof documents.$inferInsert
export type RecoverySourceRow = typeof recoverySources.$inferSelect
export type NewRecoverySourceRow = typeof recoverySources.$inferInsert
