import type {
  DocumentRecord,
  DocumentRepo,
  InsertDocumentInput,
  InsertDocumentResult,
} from './document-repo'

/**
 * In-memory DocumentRepo. Honors the UNIQUE (case_id, sha256)
 * constraint by surfacing `duplicate_sha256` instead of double-
 * inserting. Mirrors the Drizzle implementation's contract so the
 * service layer code is identical against either repo.
 */

export function createInMemoryDocumentRepo(): DocumentRepo {
  const documents = new Map<string, DocumentRecord>()
  const byCaseSha = new Map<string, string>() // `${caseId}__${sha256}` → documentId

  return {
    async insertDocument(input: InsertDocumentInput): Promise<InsertDocumentResult> {
      const dedupeKey = `${input.caseId}__${input.sha256}`
      const existingId = byCaseSha.get(dedupeKey)
      if (existingId) {
        const existing = documents.get(existingId)
        if (existing) return { outcome: 'duplicate_sha256', document: existing }
      }
      const record: DocumentRecord = {
        id: input.id,
        caseId: input.caseId,
        storageKey: input.storageKey,
        filename: input.filename,
        contentType: input.contentType,
        byteSize: input.byteSize,
        sha256: input.sha256,
        uploadedBy: input.uploadedBy,
        uploadedByActorId: input.uploadedByActorId,
        version: 1,
        supersedesId: input.supersedesId ?? null,
        createdAt: input.createdAt,
      }
      documents.set(record.id, record)
      byCaseSha.set(dedupeKey, record.id)
      return { outcome: 'created', document: record }
    },
    async findDocument(documentId: string) {
      return documents.get(documentId)
    },
    async listDocumentsForCase(caseId: string) {
      return [...documents.values()]
        .filter((d) => d.caseId === caseId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
  }
}
