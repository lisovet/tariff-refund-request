/**
 * Recovery context — public surface (UI-safe).
 *
 * Per the public-surface split convention: pure types + helpers here;
 * Drizzle/storage adapters live in `@contexts/recovery/server`.
 */

export type {
  AcceptedContentType,
  UploadValidationError,
  UploadValidationInput,
  UploadValidationResult,
} from './upload-validation'
export {
  ACCEPTED_CONTENT_TYPES,
  MAX_UPLOAD_BYTES,
  isAcceptedContentType,
  validateUploadRequest,
} from './upload-validation'

export type {
  DocumentRecord,
  DocumentRepo,
  InsertDocumentInput,
  InsertDocumentResult,
} from './document-repo'
export { HUMAN_LABEL_FOR_KIND } from './document-repo'

export type {
  CompleteUploadDeps,
  CompleteUploadInput,
  CompleteUploadResult,
  PrepareUploadDeps,
  PrepareUploadInput,
  PrepareUploadResult,
} from './upload'
export { completeUpload, prepareUpload } from './upload'
