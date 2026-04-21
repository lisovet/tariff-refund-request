import {
  CURRENT_IEEPA_WINDOW,
  canonicalizeEntryNumber,
  tagEntry,
  type IeepaWindow,
} from '@contexts/entries'
import {
  ReadinessReportSchema,
  type EntryStatus,
  type PrerequisiteCheck,
  type ReadinessReport,
} from './schema'

/**
 * CAPE validator per PRD 03 §Validation rules + ADR 014.
 *
 * Input: a batch of candidate entries + prerequisite checks + the
 * IEEPA window + optional batch-size threshold.
 * Output: a ReadinessReport aggregate. The output ALWAYS satisfies
 * ReadinessReportSchema (the tests assert this); the validator is
 * the canonical path from raw analyst data → the customer-facing
 * artifact shape.
 *
 * Severity policy:
 *   blocking — prevents CSV download. Covers schema-level failures
 *              (malformed entry number, missing IOR, missing HTS on
 *              duty-bearing entry, outside-window date, duplicate).
 *   warning  — analyst sign-off required but not blocking
 *              (low source-confidence, batch-size over threshold).
 *   info     — observational (ACH not on file, phase-boundary
 *              segmentation recommendations).
 *
 * Severity precedence: blocking > warning > ok. When two rules fire
 * on the same entry, all notes land in the entry's `notes[]`, but
 * the row's `status` reflects the highest severity.
 */

export interface ValidatorEntry {
  readonly id: string
  readonly rawEntryNumber: string
  readonly entryDate: string | null
  readonly importerOfRecord: string | null
  readonly dutyAmountUsdCents: number | null
  readonly htsCodes: readonly string[]
  readonly sourceConfidence: 'high' | 'medium' | 'low'
}

export interface ValidatorInput {
  readonly batchId: string
  readonly generatedAt: Date
  readonly entries: readonly ValidatorEntry[]
  readonly prerequisites: readonly PrerequisiteCheck[]
  readonly window?: IeepaWindow
  readonly batchSizeThreshold?: number
  readonly csvKey: string
  readonly pdfKey: string
}

interface MutableEntryRow {
  readonly entryId: string
  status: EntryStatus
  readonly notes: string[]
}

export function validateBatch(input: ValidatorInput): ReadinessReport {
  const window = input.window ?? CURRENT_IEEPA_WINDOW

  const rows: MutableEntryRow[] = input.entries.map((e) => ({
    entryId: e.id,
    status: 'ok',
    notes: [],
  }))

  // Track canonical entry numbers to detect duplicates after the
  // first valid occurrence.
  const seenCanonical = new Map<string, number>()

  input.entries.forEach((entry, index) => {
    const row = rows[index] as MutableEntryRow

    // Rule: entry-number canonicalizes.
    const canonical = canonicalizeEntryNumber(entry.rawEntryNumber)
    if (!canonical.ok) {
      row.notes.push(`Entry number failed canonicalization: ${canonical.reason}.`)
      row.status = 'blocking'
    } else {
      const prior = seenCanonical.get(canonical.canonical)
      if (prior !== undefined) {
        row.notes.push(
          `Duplicate of row ${prior + 1} (${canonical.canonical}).`,
        )
        row.status = 'blocking'
      } else {
        seenCanonical.set(canonical.canonical, index)
      }
    }

    // Rule: IOR required.
    if (!entry.importerOfRecord || entry.importerOfRecord.trim().length === 0) {
      row.notes.push('Importer of record missing.')
      row.status = 'blocking'
    }

    // Rule: HTS on a duty-bearing entry.
    const duty = entry.dutyAmountUsdCents ?? 0
    if (duty > 0 && entry.htsCodes.length === 0) {
      row.notes.push('HTS code missing on a duty-bearing entry.')
      row.status = 'blocking'
    }

    // Rule: inside IEEPA window.
    const tag = tagEntry({ entryDate: entry.entryDate ?? null }, window)
    if (!tag.inWindow) {
      row.notes.push(
        `Entry date ${entry.entryDate ?? '(missing)'} is outside the IEEPA window (${window.version}).`,
      )
      row.status = 'blocking'
    }

    // Rule: low source-confidence → warning (non-blocking).
    if (entry.sourceConfidence === 'low') {
      row.notes.push(
        'Source confidence low — duty value may be reconstructed from a carrier invoice; analyst sign-off required.',
      )
      if (row.status === 'ok') row.status = 'warning'
    }
  })

  // Batch-level: size over threshold is an info note on the first
  // entry for now. The PDF report (#65) will render this as a
  // batch-summary chip; until then, attaching it to an entry row
  // keeps the contract (ReadinessReport.entries[]) clean.
  if (
    input.batchSizeThreshold !== undefined &&
    input.entries.length > input.batchSizeThreshold
  ) {
    const first = rows[0]
    if (first) {
      first.notes.push(
        `Batch size ${input.entries.length} exceeds threshold ${input.batchSizeThreshold} — recommend split.`,
      )
    }
  }

  // Prerequisite-level info: ACH on file is informational only in v1.
  const achCheck = input.prerequisites.find((p) => p.id === 'ach_on_file')
  if (achCheck && !achCheck.met) {
    const target = rows[0]
    if (target) {
      target.notes.push(
        'ACH refund authorization is not on file — refunds will be issued by CBP paper check unless set up before filing.',
      )
    }
  }

  const blockingCount = rows.filter((r) => r.status === 'blocking').length
  const warningCount = rows.filter((r) => r.status === 'warning').length

  const batchSizeNotes = rows.flatMap((r) =>
    r.notes.filter((n) => /batch size/i.test(n) || /\bach\b/i.test(n)),
  )
  const infoCount = batchSizeNotes.length

  const report: ReadinessReport = {
    id: `rdy_${input.batchId}_${input.generatedAt.getTime().toString(36)}`,
    batchId: input.batchId,
    generatedAt: input.generatedAt.toISOString(),
    entries: rows.map((r) => ({
      entryId: r.entryId,
      status: r.status,
      notes: [...r.notes],
    })),
    prerequisites: input.prerequisites.map((p) => ({ ...p })),
    blockingCount,
    warningCount,
    infoCount,
    artifactKeys: {
      csvKey: input.csvKey,
      pdfKey: input.pdfKey,
    },
  }

  // Schema-validate on the way out so callers never receive a malformed
  // report — throws loudly with a clear message if an invariant drifts.
  return ReadinessReportSchema.parse(report)
}

// Re-export for tests that want the schema for direct assertions.
export { ReadinessReportSchema } from './schema'
