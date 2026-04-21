/**
 * Storage primitives — shared by the S3/R2/MinIO adapter and the in-memory
 * adapter. Per ADR 006, document keys are case-scoped:
 *
 *     cases/{caseId}/{documentId}/{filename}
 *
 * This layout makes per-case revocation a cheap prefix delete and ensures
 * documents are never colocated across customers.
 */

export type StorageKey = string

export interface CaseScopedKeyParts {
  readonly caseId: string
  readonly documentId: string
  readonly filename: string
}

const SEGMENT_RE = /^[A-Za-z0-9._-]+$/

function assertValidSegment(name: string, value: string): void {
  if (value.length === 0) throw new Error(`${name} is required`)
  if (!SEGMENT_RE.test(value)) {
    throw new Error(`${name} contains invalid characters: ${value}`)
  }
}

export function caseScopedKey(parts: CaseScopedKeyParts): StorageKey {
  assertValidSegment('caseId', parts.caseId)
  assertValidSegment('documentId', parts.documentId)
  assertValidSegment('filename', parts.filename)
  return `cases/${parts.caseId}/${parts.documentId}/${parts.filename}`
}

export function isStorageKey(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false
  if (!value.startsWith('cases/')) return false
  const segments = value.split('/')
  if (segments.length !== 4) return false
  return segments.slice(1).every((s) => SEGMENT_RE.test(s))
}

/** Per ADR 006: pre-signed upload URLs expire in 15 minutes max. */
export const MAX_UPLOAD_URL_EXPIRY_SECONDS = 900

/** Pre-signed read URLs default to 10 minutes; 1 hour ceiling. */
export const DEFAULT_READ_URL_EXPIRY_SECONDS = 600
export const MAX_READ_URL_EXPIRY_SECONDS = 3600

export interface StorageAdapter {
  putObject(
    key: StorageKey,
    body: Buffer,
    contentType?: string,
  ): Promise<void>
  getObject(key: StorageKey): Promise<Buffer>
  deleteObject(key: StorageKey): Promise<void>
  headObject(key: StorageKey): Promise<{ exists: boolean; size?: number }>
  getSignedUploadUrl(
    key: StorageKey,
    contentType: string,
    expirySeconds?: number,
  ): Promise<string>
  getSignedReadUrl(key: StorageKey, expirySeconds?: number): Promise<string>
}
