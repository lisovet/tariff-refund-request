import { describe, expect, it } from 'vitest'
import { buildCapeCsv, CAPE_CSV_HEADERS, type BuildCapeCsvInput } from '../csv-builder'
import type { CapeEntryRow, ReadinessReport } from '../schema'

const FIXED_NOW = new Date('2026-04-21T12:00:00.000Z')

const ENTRY_A: CapeEntryRow = {
  id: 'ent_a',
  entryNumber: 'ABC-1234567-8',
  entryDate: '2024-08-15',
  importerOfRecord: 'Acme Imports LLC',
  dutyAmountUsdCents: 250_000,
  htsCodes: ['8471.30.0100'],
  phaseFlag: 'phase_1_2024_h2',
  windowVersion: 'ieepa-v1-2024',
  sourceConfidence: 'high',
}

const ENTRY_B: CapeEntryRow = {
  ...ENTRY_A,
  id: 'ent_b',
  entryNumber: '099-7654321-9', // leading-zero filer code
  entryDate: '2024-09-01',
  dutyAmountUsdCents: 1_234_56,
  htsCodes: ['8542.31.0001', '8471.30.0100'],
}

const CLEAN_REPORT: ReadinessReport = {
  id: 'rdy_test',
  batchId: 'bat_test',
  generatedAt: FIXED_NOW.toISOString(),
  entries: [
    { entryId: 'ent_a', status: 'ok', notes: [] },
    { entryId: 'ent_b', status: 'ok', notes: [] },
  ],
  prerequisites: [],
  blockingCount: 0,
  warningCount: 0,
  infoCount: 0,
  artifactKeys: { csvKey: 'cases/cas_x/cape/v1.csv', pdfKey: 'cases/cas_x/cape/v1.pdf' },
}

const BLOCKING_REPORT: ReadinessReport = {
  ...CLEAN_REPORT,
  entries: [{ entryId: 'ent_a', status: 'blocking', notes: ['Missing IOR.'] }],
  blockingCount: 1,
}

function input(overrides: Partial<BuildCapeCsvInput> = {}): BuildCapeCsvInput {
  return {
    caseId: 'cas_x',
    batchId: 'bat_test',
    generatedAt: FIXED_NOW,
    entries: [ENTRY_A, ENTRY_B],
    readinessReport: CLEAN_REPORT,
    ...overrides,
  }
}

describe('buildCapeCsv — happy path', () => {
  it('produces a CSV with the canonical header on line 1', () => {
    const result = buildCapeCsv(input())
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    const lines = result.csv.split(/\r?\n/)
    expect(lines[0]).toBe(CAPE_CSV_HEADERS.join(','))
  })

  it('writes one CSV data row per validated entry', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    const lines = result.csv.split(/\r?\n/).filter((l) => l.length > 0)
    expect(lines).toHaveLength(3) // header + 2 entries
  })

  it('quotes the entry_number cell so Excel does not strip leading zeros', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    expect(result.csv).toMatch(/"099-7654321-9"/)
  })

  it('joins multiple HTS codes inside a single quoted cell, semicolon-separated', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    expect(result.csv).toMatch(/"8542\.31\.0001;8471\.30\.0100"/)
  })

  it('renders duty as 2-decimal dollars (cents → $X.XX)', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    expect(result.csv).toMatch(/"2500\.00"/)
    expect(result.csv).toMatch(/"1234\.56"/)
  })

  it('emits a deterministic filename matching cape-{caseId}-{batchId}-{yyyymmdd}.csv', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    expect(result.filename).toBe('cape-cas_x-bat_test-20260421.csv')
  })

  it('CRLF line endings (CBP intake systems prefer CRLF)', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    expect(result.csv).toContain('\r\n')
  })
})

describe('buildCapeCsv — gating', () => {
  it('refuses to build when blockingCount > 0 (returns reason=blocking_issues_present)', () => {
    const result = buildCapeCsv(
      input({ readinessReport: BLOCKING_REPORT, entries: [ENTRY_A] }),
    )
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'blocking_issues_present') {
      throw new Error('unreachable')
    }
    expect(result.blockingCount).toBe(1)
  })

  it('refuses to build when entries is empty', () => {
    const result = buildCapeCsv(input({ entries: [] }))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('no_entries')
  })

  it('refuses to build when an entry fails the canonical schema (defense in depth)', () => {
    const bad = { ...ENTRY_A, entryNumber: 'gibberish' } as CapeEntryRow
    const result = buildCapeCsv(input({ entries: [bad] }))
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'invalid_entry') {
      throw new Error('unreachable')
    }
    expect(result.invalidEntryId).toBe('ent_a')
  })
})

describe('buildCapeCsv — golden output', () => {
  it('matches the expected CSV byte-for-byte (header + two rows)', () => {
    const result = buildCapeCsv(input())
    if (!result.ok) throw new Error('unreachable')
    const expected =
      [
        CAPE_CSV_HEADERS.join(','),
        '"ent_a","ABC-1234567-8","2024-08-15","Acme Imports LLC","2500.00","8471.30.0100","phase_1_2024_h2","ieepa-v1-2024","high"',
        '"ent_b","099-7654321-9","2024-09-01","Acme Imports LLC","1234.56","8542.31.0001;8471.30.0100","phase_1_2024_h2","ieepa-v1-2024","high"',
      ].join('\r\n') + '\r\n'
    expect(result.csv).toBe(expected)
  })
})

describe('CAPE_CSV_HEADERS', () => {
  it('includes every column the v1 schema needs (snake_case)', () => {
    expect(CAPE_CSV_HEADERS).toEqual([
      'id',
      'entry_number',
      'entry_date',
      'importer_of_record',
      'duty_amount_usd',
      'hts_codes',
      'phase_flag',
      'window_version',
      'source_confidence',
    ])
  })
})
