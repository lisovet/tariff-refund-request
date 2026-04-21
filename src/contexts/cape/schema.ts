import { z } from 'zod'
import { CANONICAL_ENTRY_NUMBER_RE } from '@contexts/entries'

/**
 * CAPE Zod schemas per ADR 014 + PRD 03.
 *
 * Three top-level shapes:
 *   - CapeEntryRow — one row in the CBP-bound CSV. Every field
 *     mirrors what the validator + CSV builder need.
 *   - Batch — a group of entries paired with a validation run.
 *   - ReadinessReport — the analyst-finalized aggregate that drives
 *     blocking/warning/info dashboards + the customer artifact.
 *
 * The schemas are the canonical source of truth — the validator
 * (#62) and the CSV builder (#63) MUST consume them.
 */

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
const ISO_TS = z.string().datetime({ message: 'must be ISO 8601 datetime' })
const HTS_CODE = z.string().regex(/^\d{4}\.\d{2}\.\d{4}$/, 'must be 4.2.4 digit-dot HTS code')

const SOURCE_CONFIDENCES = ['high', 'medium', 'low'] as const

export const CapeEntryRowSchema = z.object({
  id: z.string().min(1),
  entryNumber: z
    .string()
    .regex(CANONICAL_ENTRY_NUMBER_RE, 'must be canonical FFF-SSSSSSS-C'),
  entryDate: ISO_DATE,
  importerOfRecord: z.string().min(1),
  dutyAmountUsdCents: z.number().int().nonnegative(),
  htsCodes: z.array(HTS_CODE).min(1, 'at least one HTS code required'),
  phaseFlag: z.string().min(1),
  windowVersion: z.string().min(1),
  sourceConfidence: z.enum(SOURCE_CONFIDENCES),
})

export type CapeEntryRow = z.infer<typeof CapeEntryRowSchema>

export const BATCH_STATUSES = [
  'draft',
  'validated',
  'qa_pending',
  'ready',
  'submitted',
] as const
export type BatchStatus = (typeof BATCH_STATUSES)[number]

export const BatchSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  label: z.string().min(1),
  entryRecordIds: z.array(z.string().min(1)).min(1, 'a batch needs at least one entry'),
  phaseFlag: z.string().min(1),
  validationRunId: z.string().min(1),
  status: z.enum(BATCH_STATUSES),
})

export type Batch = z.infer<typeof BatchSchema>

export const SEVERITIES = ['blocking', 'warning', 'info'] as const
export type Severity = (typeof SEVERITIES)[number]

export const ENTRY_STATUSES = ['ok', 'warning', 'blocking'] as const
export type EntryStatus = (typeof ENTRY_STATUSES)[number]

export const PrerequisiteCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  met: z.boolean(),
})

export type PrerequisiteCheck = z.infer<typeof PrerequisiteCheckSchema>

export const ReadinessReportSchema = z
  .object({
    id: z.string().min(1),
    batchId: z.string().min(1),
    generatedAt: ISO_TS,
    entries: z.array(
      z.object({
        entryId: z.string().min(1),
        status: z.enum(ENTRY_STATUSES),
        notes: z.array(z.string().min(1)),
      }),
    ),
    prerequisites: z.array(PrerequisiteCheckSchema),
    blockingCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    infoCount: z.number().int().nonnegative(),
    artifactKeys: z.object({
      csvKey: z.string().min(1),
      pdfKey: z.string().min(1),
    }),
    analystSignoff: z
      .object({
        staffUserId: z.string().min(1),
        signedAt: ISO_TS,
        note: z.string().min(1),
      })
      .optional(),
  })
  .superRefine((report, ctx) => {
    const blocking = report.entries.filter((e) => e.status === 'blocking').length
    if (blocking !== report.blockingCount) {
      ctx.addIssue({
        code: 'custom',
        message: `blocking-count (${report.blockingCount}) does not match entry rows (${blocking})`,
        path: ['blockingCount'],
      })
    }
    const warning = report.entries.filter((e) => e.status === 'warning').length
    if (warning !== report.warningCount) {
      ctx.addIssue({
        code: 'custom',
        message: `warning-count (${report.warningCount}) does not match entry rows (${warning})`,
        path: ['warningCount'],
      })
    }
  })

export type ReadinessReport = z.infer<typeof ReadinessReportSchema>
