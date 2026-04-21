import Papa from 'papaparse'
import { canonicalizeEntryNumber } from './canonicalize'

/**
 * ACE export CSV parser per PRD 07.
 *
 * Customers with ACE Portal access export their entry summary report
 * as CSV — that's the cleanest source-confidence signal we get
 * (matches the PRD 07 source hierarchy: ACE > Broker 7501 > etc.).
 *
 * Permissive on header naming (different ACE report variants use
 * "Entry No" / "Entry Number" / "Entry_No"), strict on row content.
 * Per-row validation failures are collected as ParseError records
 * with the source row number so the analyst review queue can show
 * exactly which row failed and why.
 */

export type AceColumnKey = 'entryNumber' | 'entryDate' | 'ior' | 'duty' | 'hts'

const COLUMN_SYNONYMS: Readonly<Record<AceColumnKey, readonly string[]>> = {
  entryNumber: ['entry no', 'entry number', 'entryno', 'entry_no'],
  entryDate: ['entry date', 'entrydate', 'entry_date'],
  ior: [
    'ior',
    'importer of record',
    'importerofrecord',
    'importer of record (ior number)',
  ],
  duty: ['total duty', 'totalduty', 'total duty (usd)', 'duty', 'duty amount'],
  hts: ['hts', 'hts code', 'htscode', 'hts codes'],
}

export type AceSourceConfidence = 'high'

export interface AceEntryCandidate {
  readonly entryNumber: string
  readonly entryDate: string
  readonly importerOfRecord: string
  readonly dutyAmountUsdCents: number
  readonly htsCodes: readonly string[]
  readonly sourceConfidence: AceSourceConfidence
}

export interface AceParseError {
  readonly row: number
  readonly field: AceColumnKey | 'unknown'
  readonly reason: string
}

export type AceParseResult =
  | {
      readonly ok: true
      readonly rows: readonly AceEntryCandidate[]
      readonly errors: readonly AceParseError[]
    }
  | {
      readonly ok: false
      readonly reason: 'missing_columns'
      readonly missingColumns: readonly AceColumnKey[]
    }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const HTS_RE = /^\d{4}\.\d{2}\.\d{4}$/

export function parseAceCsv(csv: string): AceParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  const headerKeys = parsed.meta.fields ?? []
  const columnMap = mapColumns(headerKeys)
  const missing = (Object.keys(COLUMN_SYNONYMS) as AceColumnKey[]).filter(
    (key) => columnMap[key] === undefined,
  )
  if (missing.length > 0 || headerKeys.length === 0) {
    return { ok: false, reason: 'missing_columns', missingColumns: missing }
  }

  const rows: AceEntryCandidate[] = []
  const errors: AceParseError[] = []

  parsed.data.forEach((rawRow, index) => {
    const rowNumber = index + 2 // +1 for header, +1 for 1-indexed
    const candidate = parseRow(rawRow, columnMap, rowNumber)
    if (candidate.ok) rows.push(candidate.value)
    else errors.push(candidate.error)
  })

  return { ok: true, rows, errors }
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, ' ')
}

function mapColumns(headers: readonly string[]): Partial<Record<AceColumnKey, string>> {
  const map: Partial<Record<AceColumnKey, string>> = {}
  for (const key of Object.keys(COLUMN_SYNONYMS) as AceColumnKey[]) {
    const synonyms = COLUMN_SYNONYMS[key]
    const found = headers.find((h) => synonyms.includes(h))
    if (found) map[key] = found
  }
  return map
}

type RowResult =
  | { readonly ok: true; readonly value: AceEntryCandidate }
  | { readonly ok: false; readonly error: AceParseError }

function parseRow(
  raw: Record<string, string>,
  columnMap: Partial<Record<AceColumnKey, string>>,
  row: number,
): RowResult {
  const rawEntryNumber = raw[columnMap.entryNumber as string]?.trim() ?? ''
  const canonical = canonicalizeEntryNumber(rawEntryNumber)
  if (!canonical.ok) {
    return {
      ok: false,
      error: { row, field: 'entryNumber', reason: canonical.reason },
    }
  }

  const rawDate = raw[columnMap.entryDate as string]?.trim() ?? ''
  if (!ISO_DATE_RE.test(rawDate)) {
    return {
      ok: false,
      error: { row, field: 'entryDate', reason: `not a YYYY-MM-DD ISO date: ${rawDate}` },
    }
  }

  const rawIor = raw[columnMap.ior as string]?.trim() ?? ''
  if (rawIor.length === 0) {
    return { ok: false, error: { row, field: 'ior', reason: 'empty' } }
  }

  const rawDuty = raw[columnMap.duty as string]?.trim() ?? ''
  const dutyCents = parseDutyToCents(rawDuty)
  if (dutyCents === null) {
    return {
      ok: false,
      error: { row, field: 'duty', reason: `not a non-negative dollar amount: ${rawDuty}` },
    }
  }

  const rawHts = raw[columnMap.hts as string]?.trim() ?? ''
  const htsCodes = parseHtsCodes(rawHts)
  if (htsCodes === null) {
    return {
      ok: false,
      error: { row, field: 'hts', reason: `no valid HTS codes parsed from: ${rawHts}` },
    }
  }

  return {
    ok: true,
    value: {
      entryNumber: canonical.canonical,
      entryDate: rawDate,
      importerOfRecord: rawIor,
      dutyAmountUsdCents: dutyCents,
      htsCodes,
      sourceConfidence: 'high',
    },
  }
}

function parseDutyToCents(value: string): number | null {
  if (value.length === 0) return null
  const cleaned = value.replace(/[$,\s]/g, '')
  const dollars = Number(cleaned)
  if (!Number.isFinite(dollars) || dollars < 0) return null
  return Math.round(dollars * 100)
}

function parseHtsCodes(value: string): readonly string[] | null {
  if (value.length === 0) return null
  const candidates = value
    .split(/[;,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (candidates.length === 0) return null
  // We accept 10-digit HTS codes; relax this in future if needed.
  const valid = candidates.filter((c) => HTS_RE.test(c))
  if (valid.length === 0) return null
  return valid
}

// Map the AceParseError.field to the right column-key type so
// downstream code branching on the value gets exhaustive checks.
export const ACE_FIELD_KEYS: readonly AceColumnKey[] = [
  'entryNumber',
  'entryDate',
  'ior',
  'duty',
  'hts',
] as const
