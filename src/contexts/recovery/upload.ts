import { caseScopedKey, MAX_UPLOAD_URL_EXPIRY_SECONDS } from '@shared/infra/storage'
import type { ActorRef } from '@contexts/ops'
import type { DocumentRecord, DocumentRepo, InsertDocumentResult } from './document-repo'
import {
  type UploadValidationError,
  type UploadValidationInput,
  validateUploadRequest,
} from './upload-validation'

/**
 * Upload service per task #45. Two phases:
 *
 *   1. prepareUpload — validates the request, generates documentId +
 *      case-scoped storage key, returns a 15-min pre-signed PUT URL.
 *      Does NOT touch the DB; the document row is created on
 *      completion so an abandoned upload doesn't leave an orphan row.
 *
 *   2. completeUpload — verifies the object landed in the bucket
 *      (HEAD), then inserts the document row. UNIQUE (case_id, sha256)
 *      surfaces dedup as `duplicate_sha256` rather than a hard error.
 */

export interface PrepareUploadInput {
  readonly caseId: string
  readonly filename: string
  readonly contentType: string
  readonly byteSize: number
}

export interface PrepareUploadDeps {
  readonly storage: {
    getSignedUploadUrl(
      key: string,
      contentType: string,
      expirySeconds?: number,
    ): Promise<string>
  }
  readonly newDocumentId?: () => string
  readonly expirySeconds?: number
}

export type PrepareUploadResult =
  | {
      readonly ok: true
      readonly documentId: string
      readonly storageKey: string
      readonly uploadUrl: string
      readonly expiresInSeconds: number
    }
  | { readonly ok: false; readonly error: UploadValidationError }

export async function prepareUpload(
  input: PrepareUploadInput,
  deps: PrepareUploadDeps,
): Promise<PrepareUploadResult> {
  const validation = validateUploadRequest(input as UploadValidationInput)
  if (!validation.ok) return { ok: false, error: validation.error }

  const documentId = (deps.newDocumentId ?? defaultDocumentId)()
  const storageKey = caseScopedKey({
    caseId: input.caseId,
    documentId,
    filename: input.filename,
  })
  const expiry = clampExpiry(deps.expirySeconds ?? MAX_UPLOAD_URL_EXPIRY_SECONDS)
  const uploadUrl = await deps.storage.getSignedUploadUrl(
    storageKey,
    input.contentType,
    expiry,
  )
  return {
    ok: true,
    documentId,
    storageKey,
    uploadUrl,
    expiresInSeconds: expiry,
  }
}

export interface CompleteUploadInput {
  readonly caseId: string
  readonly documentId: string
  readonly storageKey: string
  readonly filename: string
  readonly contentType: string
  readonly sha256: string
}

export interface CompleteUploadDeps {
  readonly storage: {
    headObject(key: string): Promise<{ exists: boolean; size?: number }>
  }
  readonly documentRepo: DocumentRepo
  readonly clock?: () => Date
  readonly actor?: ActorRef
}

export type CompleteUploadResult =
  | { readonly ok: true; readonly document: DocumentRecord; readonly outcome: InsertDocumentResult['outcome'] }
  | {
      readonly ok: false
      readonly error:
        | 'storage_key_mismatch'
        | 'object_not_uploaded'
        | 'sha256_invalid'
    }

const SHA256_RE = /^[a-f0-9]{64}$/i

export async function completeUpload(
  input: CompleteUploadInput,
  deps: CompleteUploadDeps,
): Promise<CompleteUploadResult> {
  if (!SHA256_RE.test(input.sha256)) {
    return { ok: false, error: 'sha256_invalid' }
  }
  const expectedKey = caseScopedKey({
    caseId: input.caseId,
    documentId: input.documentId,
    filename: input.filename,
  })
  if (expectedKey !== input.storageKey) {
    return { ok: false, error: 'storage_key_mismatch' }
  }
  const head = await deps.storage.headObject(input.storageKey)
  if (!head.exists || typeof head.size !== 'number' || head.size <= 0) {
    return { ok: false, error: 'object_not_uploaded' }
  }
  const result = await deps.documentRepo.insertDocument({
    id: input.documentId,
    caseId: input.caseId,
    storageKey: input.storageKey,
    filename: input.filename,
    contentType: input.contentType,
    byteSize: head.size,
    sha256: input.sha256.toLowerCase(),
    uploadedBy: deps.actor?.role === undefined ? 'customer' : 'staff',
    uploadedByActorId: deps.actor?.id ?? null,
    createdAt: (deps.clock ?? defaultClock)(),
  })
  return { ok: true, document: result.document, outcome: result.outcome }
}

function clampExpiry(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return MAX_UPLOAD_URL_EXPIRY_SECONDS
  return Math.min(seconds, MAX_UPLOAD_URL_EXPIRY_SECONDS)
}

function defaultClock(): Date {
  return new Date()
}

let counter = 0
function defaultDocumentId(): string {
  counter += 1
  // Deterministic in tests via deps.newDocumentId; production uses
  // the schema's default (gen_random_bytes) at insert time, so this
  // ID just needs to be unique inside the request.
  return `doc_pending_${Date.now().toString(36)}_${String(counter).padStart(4, '0')}`
}
