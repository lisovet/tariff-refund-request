import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { documents, type Schema } from '@shared/infra/db/schema'
import type {
  DocumentRecord,
  DocumentRepo,
  InsertDocumentInput,
  InsertDocumentResult,
} from './document-repo'

/**
 * Drizzle-backed DocumentRepo. The UNIQUE (case_id, sha256)
 * constraint surfaces dedup as `duplicate_sha256` rather than a hard
 * insert error — we look up the existing row first, and if absent
 * insert; race conditions land in the unique-violation catch and
 * then re-look-up.
 */

export function createDrizzleDocumentRepo(
  db: PostgresJsDatabase<Schema>,
): DocumentRepo {
  return {
    async insertDocument(input: InsertDocumentInput): Promise<InsertDocumentResult> {
      const existing = await findByCaseSha(db, input.caseId, input.sha256)
      if (existing) return { outcome: 'duplicate_sha256', document: existing }

      try {
        const inserted = await db
          .insert(documents)
          .values({
            id: input.id,
            caseId: input.caseId,
            storageKey: input.storageKey,
            filename: input.filename,
            contentType: input.contentType,
            byteSize: input.byteSize,
            sha256: input.sha256,
            uploadedBy: input.uploadedBy,
            uploadedByActorId: input.uploadedByActorId,
            supersedesId: input.supersedesId ?? null,
            createdAt: input.createdAt,
          })
          .returning()
        const row = inserted[0]
        if (!row) throw new Error('insertDocument: insert returned no rows')
        return { outcome: 'created', document: mapRow(row) }
      } catch (err) {
        // Race: another writer beat us to the unique slot. Look up
        // their row and surface as a duplicate.
        const racy = await findByCaseSha(db, input.caseId, input.sha256)
        if (racy) return { outcome: 'duplicate_sha256', document: racy }
        throw err
      }
    },
    async findDocument(documentId: string) {
      const rows = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)
      const row = rows[0]
      return row ? mapRow(row) : undefined
    },
    async listDocumentsForCase(caseId: string) {
      const rows = await db
        .select()
        .from(documents)
        .where(eq(documents.caseId, caseId))
        .orderBy(desc(documents.createdAt))
      return rows.map(mapRow)
    },
  }
}

async function findByCaseSha(
  db: PostgresJsDatabase<Schema>,
  caseId: string,
  sha256: string,
): Promise<DocumentRecord | undefined> {
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.sha256, sha256)))
    .limit(1)
  const row = rows[0]
  return row ? mapRow(row) : undefined
}

type DocumentDbRow = typeof documents.$inferSelect

function mapRow(row: DocumentDbRow): DocumentRecord {
  return {
    id: row.id,
    caseId: row.caseId,
    storageKey: row.storageKey,
    filename: row.filename,
    contentType: row.contentType,
    byteSize: Number(row.byteSize),
    sha256: row.sha256,
    uploadedBy: row.uploadedBy,
    uploadedByActorId: row.uploadedByActorId,
    version: Number(row.version),
    supersedesId: row.supersedesId,
    createdAt: row.createdAt,
  }
}
