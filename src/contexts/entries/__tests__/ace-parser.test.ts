import { describe, expect, it } from 'vitest'
import { parseAceCsv, type AceParseResult } from '../ace-parser'

const HEADER = 'Entry No,Entry Date,IOR,Total Duty,HTS\n'

const VALID_ROW = 'ABC-1234567-8,2024-08-15,Acme Imports LLC,2500.00,8471.30.0100\n'

function ok(result: AceParseResult): result is Extract<AceParseResult, { ok: true }> {
  return result.ok === true
}

describe('parseAceCsv — happy path', () => {
  it('parses a single valid row into one EntryCandidate with high source-confidence', () => {
    const result = parseAceCsv(HEADER + VALID_ROW)
    expect(result.ok).toBe(true)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(1)
    const row = result.rows[0]
    expect(row?.entryNumber).toBe('ABC-1234567-8')
    expect(row?.entryDate).toBe('2024-08-15')
    expect(row?.importerOfRecord).toBe('Acme Imports LLC')
    expect(row?.dutyAmountUsdCents).toBe(250_000)
    expect(row?.htsCodes).toEqual(['8471.30.0100'])
    expect(row?.sourceConfidence).toBe('high')
    expect(result.errors).toEqual([])
  })

  it('parses multiple rows', () => {
    const csv =
      HEADER +
      VALID_ROW +
      'XYZ-7654321-9,2024-09-20,Another Co Inc,1234.56,8542.31.0001\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[1]?.entryNumber).toBe('XYZ-7654321-9')
    expect(result.rows[1]?.dutyAmountUsdCents).toBe(123_456)
  })

  it('accepts multiple HTS codes separated by semicolons or spaces', () => {
    const csv =
      HEADER +
      'ABC-1234567-8,2024-08-15,Acme Imports LLC,2500.00,8471.30.0100; 8542.31.0001\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows[0]?.htsCodes).toEqual([
      '8471.30.0100',
      '8542.31.0001',
    ])
  })
})

describe('parseAceCsv — header normalization', () => {
  it.each([
    'Entry Number,Entry Date,IOR,Total Duty,HTS\n',
    'entry no,entry date,ior,total duty,hts\n',
    'Entry_No,Entry_Date,Importer of Record,Total Duty (USD),HTS Code\n',
    '"Entry No","Entry Date","IOR","Total Duty","HTS"\n',
  ])('accepts header variants: %j', (header) => {
    const result = parseAceCsv(header + VALID_ROW)
    expect(result.ok).toBe(true)
    if (ok(result)) expect(result.rows).toHaveLength(1)
  })

  it('rejects when a required column is missing entirely', () => {
    const result = parseAceCsv(
      'Entry No,Entry Date,IOR\nABC-1234567-8,2024-08-15,Acme Imports LLC\n',
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('missing_columns')
    expect(result.missingColumns).toEqual(expect.arrayContaining(['duty', 'hts']))
  })
})

describe('parseAceCsv — per-row errors', () => {
  it('drops rows with malformed entry numbers + records the error with row number', () => {
    const csv =
      HEADER +
      VALID_ROW +
      'gibberish,2024-08-15,Acme Imports LLC,100,8471.30.0100\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.row).toBe(3) // header + 1 valid + this one
    expect(result.errors[0]?.field).toBe('entryNumber')
    expect(result.errors[0]?.reason).toMatch(/length|filer/i)
  })

  it('drops rows with malformed dates', () => {
    const csv =
      HEADER +
      'ABC-1234567-8,August 2024,Acme Imports LLC,100,8471.30.0100\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]?.field).toBe('entryDate')
  })

  it('drops rows with non-numeric duty', () => {
    const csv =
      HEADER +
      'ABC-1234567-8,2024-08-15,Acme Imports LLC,not-a-number,8471.30.0100\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]?.field).toBe('duty')
  })

  it('drops rows with negative duty', () => {
    const csv =
      HEADER +
      'ABC-1234567-8,2024-08-15,Acme Imports LLC,-100,8471.30.0100\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]?.field).toBe('duty')
  })

  it('reports multiple errors across rows but still returns the valid rows', () => {
    const csv =
      HEADER +
      VALID_ROW +
      'gibberish,2024-08-15,Acme,1.0,8471.30.0100\n' +
      VALID_ROW.replace('ABC-1234567-8', 'XYZ-7654321-9') +
      'ABC-1234567-8,August 2024,Acme,100,8471.30.0100\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows).toHaveLength(2)
    expect(result.errors).toHaveLength(2)
  })
})

describe('parseAceCsv — empty input', () => {
  it('returns ok with empty rows when input is just a header', () => {
    const result = parseAceCsv(HEADER)
    expect(result.ok).toBe(true)
    if (ok(result)) {
      expect(result.rows).toEqual([])
      expect(result.errors).toEqual([])
    }
  })

  it('returns missing_columns when input is empty', () => {
    const result = parseAceCsv('')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing_columns')
  })
})

describe('parseAceCsv — Excel-stripped leading zeros', () => {
  it('canonicalizes correctly when filer code looks numeric (e.g., "099-1234567-8")', () => {
    // Excel sometimes strips leading zeros from filer codes; the
    // canonicalizer accepts 3-char alphanumeric, so a 3-digit filer
    // is valid input. This covers the simpler case.
    const csv =
      HEADER +
      '099-1234567-8,2024-08-15,Acme Imports LLC,100,8471.30.0100\n'
    const result = parseAceCsv(csv)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.rows[0]?.entryNumber).toBe('099-1234567-8')
  })
})
