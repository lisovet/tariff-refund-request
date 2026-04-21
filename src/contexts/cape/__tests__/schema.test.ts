import { describe, expect, it } from 'vitest'
import {
  BATCH_STATUSES,
  BatchSchema,
  CapeEntryRowSchema,
  ENTRY_STATUSES,
  PrerequisiteCheckSchema,
  ReadinessReportSchema,
  SEVERITIES,
  type Batch,
  type CapeEntryRow,
  type ReadinessReport,
} from '../schema'

const VALID_ENTRY: CapeEntryRow = {
  id: 'ent_test_1',
  entryNumber: 'ABC-1234567-8',
  entryDate: '2024-08-15',
  importerOfRecord: 'Acme Imports LLC',
  dutyAmountUsdCents: 250_000,
  htsCodes: ['8471.30.0100'],
  phaseFlag: 'phase_1_2024_h2',
  windowVersion: 'ieepa-v1-2024',
  sourceConfidence: 'high',
}

describe('CapeEntryRowSchema — happy', () => {
  it('accepts a full valid row', () => {
    expect(() => CapeEntryRowSchema.parse(VALID_ENTRY)).not.toThrow()
  })

  it('accepts htsCodes with one entry', () => {
    expect(() =>
      CapeEntryRowSchema.parse({ ...VALID_ENTRY, htsCodes: ['8471.30.0100'] }),
    ).not.toThrow()
  })
})

describe('CapeEntryRowSchema — rejections', () => {
  it.each([
    ['empty entryNumber', { entryNumber: '' }],
    ['malformed entryNumber (lowercase)', { entryNumber: 'abc-1234567-8' }],
    ['malformed entryNumber (no dashes)', { entryNumber: 'ABC12345678' }],
    ['non-ISO entryDate', { entryDate: 'August 2024' }],
    ['empty IOR', { importerOfRecord: '' }],
    ['negative duty', { dutyAmountUsdCents: -1 }],
    ['fractional duty', { dutyAmountUsdCents: 100.5 }],
    ['empty htsCodes array', { htsCodes: [] }],
    ['malformed HTS code', { htsCodes: ['not-a-code'] }],
    ['unknown source confidence', { sourceConfidence: 'gut_feeling' }],
  ])('rejects: %s', (_label, override) => {
    expect(() =>
      CapeEntryRowSchema.parse({ ...VALID_ENTRY, ...override }),
    ).toThrow()
  })
})

describe('BatchSchema', () => {
  const VALID_BATCH: Batch = {
    id: 'bat_test_1',
    caseId: 'cas_test',
    label: 'Q3 2024 broker entries',
    entryRecordIds: ['ent_1', 'ent_2'],
    phaseFlag: 'phase_1_2024_h2',
    validationRunId: 'val_test_1',
    status: 'draft',
  }

  it('accepts a valid batch', () => {
    expect(() => BatchSchema.parse(VALID_BATCH)).not.toThrow()
  })

  it('exposes the v1 status enum from PRD 03', () => {
    expect(BATCH_STATUSES).toEqual(
      expect.arrayContaining([
        'draft',
        'validated',
        'qa_pending',
        'ready',
        'submitted',
      ]),
    )
  })

  it.each([
    ['empty entryRecordIds', { entryRecordIds: [] }],
    ['unknown status', { status: 'cooking' }],
    ['empty label', { label: '' }],
  ])('rejects: %s', (_label, override) => {
    expect(() => BatchSchema.parse({ ...VALID_BATCH, ...override })).toThrow()
  })
})

describe('SEVERITIES + ENTRY_STATUSES', () => {
  it('SEVERITIES = blocking | warning | info', () => {
    expect([...SEVERITIES].sort()).toEqual(['blocking', 'info', 'warning'])
  })

  it('ENTRY_STATUSES = ok | warning | blocking', () => {
    expect([...ENTRY_STATUSES].sort()).toEqual(['blocking', 'ok', 'warning'])
  })
})

describe('ReadinessReportSchema — happy', () => {
  const VALID_REPORT: ReadinessReport = {
    id: 'rdy_test_1',
    batchId: 'bat_test_1',
    generatedAt: '2026-04-21T12:00:00.000Z',
    entries: [
      { entryId: 'ent_1', status: 'ok', notes: [] },
      { entryId: 'ent_2', status: 'warning', notes: ['Reconstructed duty from carrier invoice.'] },
    ],
    prerequisites: [
      { id: 'ace_account', label: 'Active ACE Portal account', met: true },
      { id: 'ach_on_file', label: 'ACH refund authorization on file', met: false },
    ],
    blockingCount: 0,
    warningCount: 1,
    infoCount: 0,
    artifactKeys: {
      csvKey: 'cases/cas_test/cape/v1.csv',
      pdfKey: 'cases/cas_test/cape/v1.pdf',
    },
  }

  it('accepts a complete report', () => {
    expect(() => ReadinessReportSchema.parse(VALID_REPORT)).not.toThrow()
  })

  it('accepts an analystSignoff when present', () => {
    expect(() =>
      ReadinessReportSchema.parse({
        ...VALID_REPORT,
        analystSignoff: {
          staffUserId: 'stf_v',
          signedAt: '2026-04-21T13:00:00.000Z',
          note: 'Approved for download.',
        },
      }),
    ).not.toThrow()
  })

  it.each([
    ['negative blockingCount', { blockingCount: -1 }],
    ['fractional warningCount', { warningCount: 0.5 }],
    ['empty csvKey', { artifactKeys: { csvKey: '', pdfKey: 'a' } }],
    ['unknown entry status', {
      entries: [{ entryId: 'ent_1', status: 'maybe', notes: [] }],
    }],
    ['malformed generatedAt', { generatedAt: 'yesterday' }],
  ])('rejects: %s', (_label, override) => {
    expect(() =>
      ReadinessReportSchema.parse({ ...VALID_REPORT, ...override }),
    ).toThrow()
  })

  it('rejects when blocking-count contradicts the entries list', () => {
    expect(() =>
      ReadinessReportSchema.parse({
        ...VALID_REPORT,
        blockingCount: 0,
        entries: [
          { entryId: 'ent_1', status: 'blocking', notes: ['Missing IOR.'] },
        ],
      }),
    ).toThrow(/blocking[\s-]*count/i)
  })

  it('rejects when warning-count contradicts the entries list', () => {
    expect(() =>
      ReadinessReportSchema.parse({
        ...VALID_REPORT,
        warningCount: 0,
        entries: [
          { entryId: 'ent_1', status: 'warning', notes: ['Reconstructed.'] },
        ],
      }),
    ).toThrow(/warning[\s-]*count/i)
  })
})

describe('PrerequisiteCheckSchema', () => {
  it('accepts a complete check', () => {
    expect(() =>
      PrerequisiteCheckSchema.parse({
        id: 'ace_account',
        label: 'Active ACE Portal account',
        met: true,
      }),
    ).not.toThrow()
  })

  it('rejects empty id or label', () => {
    expect(() =>
      PrerequisiteCheckSchema.parse({ id: '', label: 'x', met: true }),
    ).toThrow()
    expect(() =>
      PrerequisiteCheckSchema.parse({ id: 'a', label: '', met: true }),
    ).toThrow()
  })

  it('coerces met to boolean — explicit booleans only', () => {
    // Zod boolean is strict; "true" string won't pass.
    expect(() =>
      PrerequisiteCheckSchema.parse({ id: 'a', label: 'b', met: 'true' }),
    ).toThrow()
  })
})
