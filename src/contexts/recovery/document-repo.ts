import type { DocumentKind, DocumentUploader } from '@shared/infra/db/schema'

/**
 * Document repository for the recovery context. Two implementations:
 * in-memory (tests + dev) and Drizzle (Postgres). Both honor the
 * UNIQUE (case_id, sha256) constraint by surfacing a `duplicate_sha256`
 * result so callers can report the existing document instead of
 * inserting a second copy.
 */

export interface DocumentRecord {
  readonly id: string
  readonly caseId: string
  readonly storageKey: string
  readonly filename: string
  readonly contentType: string
  readonly byteSize: number
  readonly sha256: string
  readonly uploadedBy: DocumentUploader
  readonly uploadedByActorId: string | null
  readonly version: number
  readonly supersedesId: string | null
  readonly createdAt: Date
}

export interface InsertDocumentInput {
  readonly id: string
  readonly caseId: string
  readonly storageKey: string
  readonly filename: string
  readonly contentType: string
  readonly byteSize: number
  readonly sha256: string
  readonly uploadedBy: DocumentUploader
  readonly uploadedByActorId: string | null
  readonly supersedesId?: string
  readonly createdAt: Date
}

export type InsertDocumentResult =
  | { readonly outcome: 'created'; readonly document: DocumentRecord }
  | { readonly outcome: 'duplicate_sha256'; readonly document: DocumentRecord }

export interface DocumentRepo {
  insertDocument(input: InsertDocumentInput): Promise<InsertDocumentResult>
  findDocument(documentId: string): Promise<DocumentRecord | undefined>
  /**
   * List documents on a case, newest first. Used by the recovery
   * workspace to render the upload history.
   */
  listDocumentsForCase(caseId: string): Promise<readonly DocumentRecord[]>
}

/**
 * Recovery-source kind helpers — keep this module's surface narrow so
 * the workspace UI can render filtered upload lists without importing
 * the schema layer.
 */
export const HUMAN_LABEL_FOR_KIND: Readonly<Record<DocumentKind, string>> = {
  ace_export: 'ACE export',
  broker_7501: 'Broker 7501',
  broker_spreadsheet: 'Broker spreadsheet',
  carrier_invoice: 'Carrier invoice',
  paper_scan: 'Paper scan',
  other: 'Other',
}
