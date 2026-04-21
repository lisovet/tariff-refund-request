/**
 * CAPE context — public surface.
 *
 * Owns the canonical CAPE schema (Zod) per ADR 014. The validator
 * (#62), the CSV builder (#63), and the Readiness Report PDF (#65+)
 * all consume from here.
 */

export type {
  Batch,
  BatchStatus,
  CapeEntryRow,
  EntryStatus,
  PrerequisiteCheck,
  ReadinessReport,
  Severity,
} from './schema'
export {
  BATCH_STATUSES,
  BatchSchema,
  CapeEntryRowSchema,
  ENTRY_STATUSES,
  PrerequisiteCheckSchema,
  ReadinessReportSchema,
  SEVERITIES,
} from './schema'

export type { ValidatorEntry, ValidatorInput } from './validator'
export { validateBatch } from './validator'

export type {
  BuildCapeCsvInput,
  BuildCapeCsvResult,
  CapeCsvHeader,
} from './csv-builder'
export { CAPE_CSV_HEADERS, buildCapeCsv } from './csv-builder'

export type {
  BatchSuggestion,
  GroupableEntry,
  SuggestBatchesOptions,
} from './grouping'
export { DEFAULT_MAX_BATCH_SIZE, suggestBatches } from './grouping'

export type {
  ChecklistSubmission,
  QaChecklistItem,
  SignOffBatchDeps,
  SignOffBatchInput,
  SignOffBatchResult,
  SignOffRecord,
} from './sign-off'
export { QA_CHECKLIST_ITEMS, signOffBatch } from './sign-off'
