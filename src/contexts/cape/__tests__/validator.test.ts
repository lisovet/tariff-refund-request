import { describe, expect, it } from 'vitest'
import {
  ReadinessReportSchema,
  validateBatch,
  type ValidatorEntry,
  type ValidatorInput,
} from '../validator'
import { CURRENT_IEEPA_WINDOW } from '@contexts/entries'

const FIXED_NOW = new Date('2026-04-21T12:00:00.000Z')

const VALID_ENTRY: ValidatorEntry = {
  id: 'ent_1',
  rawEntryNumber: 'ABC-1234567-8',
  entryDate: '2024-08-15',
  importerOfRecord: 'Acme Imports LLC',
  dutyAmountUsdCents: 250_000,
  htsCodes: ['8471.30.0100'],
  sourceConfidence: 'high',
}

function baseInput(overrides: Partial<ValidatorInput> = {}): ValidatorInput {
  return {
    batchId: 'bat_1',
    generatedAt: FIXED_NOW,
    entries: [VALID_ENTRY],
    prerequisites: [
      { id: 'ace_account', label: 'Active ACE Portal account', met: true },
      { id: 'ach_on_file', label: 'ACH refund authorization on file', met: false },
      { id: 'ior_status', label: 'Importer of record', met: true },
    ],
    window: CURRENT_IEEPA_WINDOW,
    batchSizeThreshold: 100,
    csvKey: 'cases/cas_x/cape/v1.csv',
    pdfKey: 'cases/cas_x/cape/v1.pdf',
    ...overrides,
  }
}

function expectValidReport(report: unknown) {
  // The Readiness Report shape is the canonical contract; the
  // validator MUST always return something the schema accepts.
  expect(() => ReadinessReportSchema.parse(report)).not.toThrow()
}

describe('validateBatch — happy path', () => {
  it('returns a clean report when one valid entry is supplied', () => {
    const report = validateBatch(baseInput())
    expectValidReport(report)
    expect(report.blockingCount).toBe(0)
    expect(report.warningCount).toBe(0)
    expect(report.entries[0]?.status).toBe('ok')
  })

  it('always populates artifactKeys + generatedAt + batchId on the output', () => {
    const report = validateBatch(baseInput())
    expect(report.batchId).toBe('bat_1')
    expect(report.artifactKeys.csvKey).toBe('cases/cas_x/cape/v1.csv')
    expect(report.artifactKeys.pdfKey).toBe('cases/cas_x/cape/v1.pdf')
    expect(report.generatedAt).toBe(FIXED_NOW.toISOString())
  })
})

describe('validateBatch — blocking rules per PRD 03', () => {
  it('flags invalid entry-number format as blocking', () => {
    const report = validateBatch(
      baseInput({
        entries: [{ ...VALID_ENTRY, rawEntryNumber: 'gibberish' }],
      }),
    )
    expectValidReport(report)
    expect(report.entries[0]?.status).toBe('blocking')
    expect(report.entries[0]?.notes.join(' ')).toMatch(/entry.number/i)
    expect(report.blockingCount).toBe(1)
  })

  it('flags an entry outside the IEEPA window as blocking', () => {
    const report = validateBatch(
      baseInput({
        entries: [{ ...VALID_ENTRY, entryDate: '2023-01-15' }],
      }),
    )
    expect(report.entries[0]?.status).toBe('blocking')
    expect(report.entries[0]?.notes.join(' ')).toMatch(/window/i)
  })

  it('flags missing IOR as blocking', () => {
    const report = validateBatch(
      baseInput({ entries: [{ ...VALID_ENTRY, importerOfRecord: '' }] }),
    )
    expect(report.entries[0]?.status).toBe('blocking')
    expect(report.entries[0]?.notes.join(' ')).toMatch(/importer/i)
  })

  it('flags missing HTS on a duty-bearing entry as blocking', () => {
    const report = validateBatch(
      baseInput({ entries: [{ ...VALID_ENTRY, htsCodes: [] }] }),
    )
    expect(report.entries[0]?.status).toBe('blocking')
    expect(report.entries[0]?.notes.join(' ')).toMatch(/hts/i)
  })

  it('flags duplicate canonical entry numbers as blocking on the duplicate row', () => {
    const report = validateBatch(
      baseInput({
        entries: [
          { ...VALID_ENTRY, id: 'ent_1', rawEntryNumber: 'ABC-1234567-8' },
          { ...VALID_ENTRY, id: 'ent_2', rawEntryNumber: 'abc-1234567-8' },
        ],
      }),
    )
    expect(report.entries[0]?.status).toBe('ok')
    expect(report.entries[1]?.status).toBe('blocking')
    expect(report.entries[1]?.notes.join(' ')).toMatch(/duplicate/i)
    expect(report.blockingCount).toBe(1)
  })
})

describe('validateBatch — warning rules', () => {
  it('flags low source-confidence rows as warning', () => {
    const report = validateBatch(
      baseInput({ entries: [{ ...VALID_ENTRY, sourceConfidence: 'low' }] }),
    )
    expect(report.entries[0]?.status).toBe('warning')
    expect(report.warningCount).toBe(1)
    expect(report.entries[0]?.notes.join(' ')).toMatch(/confidence|reconstructed/i)
  })

  it('does NOT promote warning to blocking on its own', () => {
    const report = validateBatch(
      baseInput({ entries: [{ ...VALID_ENTRY, sourceConfidence: 'low' }] }),
    )
    expect(report.blockingCount).toBe(0)
  })

  it('flags batch over threshold with a batch-level info note (not entry-level)', () => {
    const lots = Array.from({ length: 120 }, (_, i) => ({
      ...VALID_ENTRY,
      id: `ent_${i}`,
      rawEntryNumber: `ABC-${String(1000000 + i).padStart(7, '0')}-${i % 10}`,
    }))
    const report = validateBatch(baseInput({ entries: lots, batchSizeThreshold: 100 }))
    expect(report.entries[0]?.status).toBe('ok')
    expect(report.infoCount).toBeGreaterThan(0)
    // Batch-level notes are stored on the first entry (synthetic
    // batch summary placeholder until #65 PDF report ships).
    const allNotes = report.entries.flatMap((e) => e.notes).join(' ')
    expect(allNotes).toMatch(/batch.*threshold|batch size/i)
  })
})

describe('validateBatch — info rules', () => {
  it('emits an info note when ACH is not on file (prerequisite-level)', () => {
    const report = validateBatch(baseInput())
    expect(report.infoCount).toBeGreaterThan(0)
    const allNotes = report.entries.flatMap((e) => e.notes).join(' ')
    expect(allNotes).toMatch(/ach/i)
  })

  it('does NOT emit ACH info when ACH IS on file', () => {
    const report = validateBatch(
      baseInput({
        prerequisites: [
          { id: 'ace_account', label: 'Active ACE Portal account', met: true },
          { id: 'ach_on_file', label: 'ACH refund authorization on file', met: true },
          { id: 'ior_status', label: 'Importer of record', met: true },
        ],
      }),
    )
    const allNotes = report.entries.flatMap((e) => e.notes).join(' ')
    expect(allNotes).not.toMatch(/ach/i)
  })
})

describe('validateBatch — severity precedence (blocking wins)', () => {
  it('keeps an entry at blocking when both warning and blocking rules trigger', () => {
    const report = validateBatch(
      baseInput({
        entries: [
          { ...VALID_ENTRY, sourceConfidence: 'low', importerOfRecord: '' },
        ],
      }),
    )
    expect(report.entries[0]?.status).toBe('blocking')
    // Both notes should be present so the analyst sees both.
    expect(report.entries[0]?.notes.length).toBeGreaterThanOrEqual(2)
  })
})

describe('validateBatch — output always parses against the schema', () => {
  it.each<[string, ValidatorInput]>([
    ['empty batch', baseInput({ entries: [] })],
    ['all blocking', baseInput({
      entries: [
        { ...VALID_ENTRY, rawEntryNumber: 'gibberish' },
        { ...VALID_ENTRY, id: 'ent_2', importerOfRecord: '' },
      ],
    })],
    ['mixed severities', baseInput({
      entries: [
        VALID_ENTRY,
        { ...VALID_ENTRY, id: 'ent_2', sourceConfidence: 'low' },
        { ...VALID_ENTRY, id: 'ent_3', rawEntryNumber: 'gibberish' },
      ],
    })],
  ])('schema-valid output for: %s', (_label, input) => {
    expectValidReport(validateBatch(input))
  })
})
