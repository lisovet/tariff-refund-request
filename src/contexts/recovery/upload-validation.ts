/**
 * Pure validators for the upload endpoint per PRD 02 + PRD 07.
 *
 * The endpoint is type-restricted to the v1 document set. Paper scans
 * are deferred to Phase 2 OCR — there's no image MIME type on the
 * allowlist by design.
 */

export const ACCEPTED_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls (legacy — broker spreadsheets in the wild)
  'text/csv',
  'message/rfc822', // .eml
] as const

export type AcceptedContentType = (typeof ACCEPTED_CONTENT_TYPES)[number]

/** 50 MB. Any single document over this is almost always a scan dump or accidental upload. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const SEGMENT_RE = /^[A-Za-z0-9._-]+$/

export type UploadValidationError =
  | 'caseId_invalid'
  | 'filename_invalid'
  | 'content_type_unsupported'
  | 'byte_size_invalid'
  | 'byte_size_too_large'

export interface UploadValidationInput {
  readonly caseId: string
  readonly filename: string
  readonly contentType: string
  readonly byteSize: number
}

export type UploadValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: UploadValidationError }

export function validateUploadRequest(input: UploadValidationInput): UploadValidationResult {
  if (!isSafeSegment(input.caseId)) return { ok: false, error: 'caseId_invalid' }
  if (!isSafeFilename(input.filename)) return { ok: false, error: 'filename_invalid' }
  if (!isAcceptedContentType(input.contentType)) {
    return { ok: false, error: 'content_type_unsupported' }
  }
  if (!Number.isFinite(input.byteSize) || input.byteSize <= 0) {
    return { ok: false, error: 'byte_size_invalid' }
  }
  if (input.byteSize > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'byte_size_too_large' }
  }
  return { ok: true }
}

function isSafeSegment(value: string): boolean {
  return value.length > 0 && SEGMENT_RE.test(value)
}

function isSafeFilename(value: string): boolean {
  if (value.length === 0) return false
  if (!SEGMENT_RE.test(value)) return false
  // Must have an extension (no bare dotfiles, no extension-only names).
  if (!value.includes('.')) return false
  if (value.startsWith('.')) return false
  if (value.endsWith('.')) return false
  return true
}

export function isAcceptedContentType(value: string): value is AcceptedContentType {
  return (ACCEPTED_CONTENT_TYPES as readonly string[]).includes(value)
}
