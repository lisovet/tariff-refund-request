import {
  CapeEntryRowSchema,
  type CapeEntryRow,
  type ReadinessReport,
} from './schema'

/**
 * CAPE-compliant CSV builder per PRD 03 §Deliverables.
 *
 * Hard rules:
 *   - REJECTS when ReadinessReport.blockingCount > 0. Blocking issues
 *     prevent CSV download; the analyst must resolve them first.
 *   - REJECTS when no entries are supplied (empty CSV is never
 *     a CBP-valid artifact).
 *   - REJECTS when any entry fails the canonical CapeEntryRowSchema —
 *     defense in depth against an in-process producer that bypassed
 *     the validator.
 *
 * Layout choices the customer / customer's broker depend on:
 *   - Every cell is quoted. Excel strips leading zeros from unquoted
 *     numeric-looking strings; CBP entry numbers and HTS codes
 *     routinely have leading zeros, so quoting is non-negotiable.
 *   - Multi-value HTS cell uses semicolon separators inside the
 *     quoted cell (so the CSV stays single-row-per-entry).
 *   - Duty rendered as 2-decimal dollars from cents.
 *   - CRLF line endings (CBP intake accepts CRLF; some legacy systems
 *     reject LF-only).
 *   - Filename pattern: cape-{caseId}-{batchId}-{yyyymmdd}.csv.
 */

export const CAPE_CSV_HEADERS = [
  'id',
  'entry_number',
  'entry_date',
  'importer_of_record',
  'duty_amount_usd',
  'hts_codes',
  'phase_flag',
  'window_version',
  'source_confidence',
] as const

export type CapeCsvHeader = (typeof CAPE_CSV_HEADERS)[number]

export interface BuildCapeCsvInput {
  readonly caseId: string
  readonly batchId: string
  readonly generatedAt: Date
  readonly entries: readonly CapeEntryRow[]
  readonly readinessReport: ReadinessReport
}

export type BuildCapeCsvResult =
  | { readonly ok: true; readonly csv: string; readonly filename: string }
  | {
      readonly ok: false
      readonly reason: 'blocking_issues_present'
      readonly blockingCount: number
    }
  | { readonly ok: false; readonly reason: 'no_entries' }
  | {
      readonly ok: false
      readonly reason: 'invalid_entry'
      readonly invalidEntryId: string
      readonly issues: readonly string[]
    }

export function buildCapeCsv(input: BuildCapeCsvInput): BuildCapeCsvResult {
  if (input.readinessReport.blockingCount > 0) {
    return {
      ok: false,
      reason: 'blocking_issues_present',
      blockingCount: input.readinessReport.blockingCount,
    }
  }
  if (input.entries.length === 0) {
    return { ok: false, reason: 'no_entries' }
  }

  // Defense in depth: every row must pass the canonical schema.
  for (const entry of input.entries) {
    const parsed = CapeEntryRowSchema.safeParse(entry)
    if (!parsed.success) {
      return {
        ok: false,
        reason: 'invalid_entry',
        invalidEntryId: entry.id,
        issues: parsed.error.issues.map((i) => i.message),
      }
    }
  }

  const rows = input.entries.map((e) => [
    e.id,
    e.entryNumber,
    e.entryDate,
    e.importerOfRecord,
    formatDollarsFromCents(e.dutyAmountUsdCents),
    e.htsCodes.join(';'),
    e.phaseFlag,
    e.windowVersion,
    e.sourceConfidence,
  ])

  const headerLine = CAPE_CSV_HEADERS.join(',')
  const dataLines = rows.map((cells) => cells.map(quoteCell).join(','))
  const csv = [headerLine, ...dataLines, ''].join('\r\n')

  return {
    ok: true,
    csv,
    filename: buildFilename(input.caseId, input.batchId, input.generatedAt),
  }
}

function formatDollarsFromCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.trunc(abs / 100)
  const fractional = String(abs % 100).padStart(2, '0')
  return `${sign}${dollars}.${fractional}`
}

function quoteCell(value: string): string {
  // Always quote, even when the cell has no special chars — protects
  // every column from Excel's leading-zero strip on import.
  return `"${value.replace(/"/g, '""')}"`
}

function buildFilename(caseId: string, batchId: string, when: Date): string {
  const yyyy = when.getUTCFullYear().toString()
  const mm = String(when.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(when.getUTCDate()).padStart(2, '0')
  return `cape-${caseId}-${batchId}-${yyyy}${mm}${dd}.csv`
}
