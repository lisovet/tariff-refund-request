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

export type {
  OutreachEmailTemplate,
  PrerequisiteCheck,
  RecoveryPath,
  RecoveryPlan,
  RecoverySLA,
} from './routing'
export {
  RECOVERY_QUEUES,
  SCHEMA_TO_RECOVERY_PATH,
  determineRecoveryPath,
  recoveryPlanFor,
} from './routing'

export type {
  OutreachKitTemplate,
  OutreachKitTokens,
  RenderedOutreachKit,
} from './templates'
export {
  OUTREACH_KIT_TEMPLATES,
  OUTREACH_TEMPLATE_VERSION,
  renderOutreachKit,
} from './templates'
