import { describe, expect, it } from 'vitest'
import {
  classifyEntries,
  type ClassifiedEntry,
  type ExistingEntry,
  type IncomingEntry,
} from '../dedupe'

const EXISTING_ENTRY: ExistingEntry = {
  entryNumber: 'ABC-1234567-8',
  entryDate: '2024-08-15',
  importerOfRecord: 'Acme Imports LLC',
}

function incoming(overrides: Partial<IncomingEntry> = {}): IncomingEntry {
  return {
    rawEntryNumber: 'XYZ-7654321-9',
    entryDate: '2024-08-15',
    importerOfRecord: 'Acme Imports LLC',
    ...overrides,
  }
}

function findOne(results: readonly ClassifiedEntry[], rawEntryNumber: string): ClassifiedEntry {
  const found = results.find((r) => r.incoming.rawEntryNumber === rawEntryNumber)
  if (!found) throw new Error(`no result for ${rawEntryNumber}`)
  return found
}

describe('classifyEntries — exact match', () => {
  it('marks an incoming entry whose canonical number matches an existing entry as exact_duplicate', () => {
    const results = classifyEntries(
      [incoming({ rawEntryNumber: 'abc-1234567-8' })],
      [EXISTING_ENTRY],
    )
    const r = findOne(results, 'abc-1234567-8')
    expect(r.outcome).toBe('exact_duplicate')
    expect(r.matchedEntry?.entryNumber).toBe('ABC-1234567-8')
  })

  it('canonicalizes the incoming number before comparing (mixed case + dashes)', () => {
    const results = classifyEntries(
      [incoming({ rawEntryNumber: 'ABC12345678' })],
      [EXISTING_ENTRY],
    )
    expect(findOne(results, 'ABC12345678').outcome).toBe('exact_duplicate')
  })
})

describe('classifyEntries — duplicates within the incoming batch', () => {
  it('flags repeated canonical numbers in the incoming list as duplicate_in_batch (after the first occurrence)', () => {
    const results = classifyEntries(
      [
        incoming({ rawEntryNumber: 'XYZ-7654321-9' }),
        incoming({ rawEntryNumber: 'xyz-7654321-9' }),
      ],
      [],
    )
    expect(results).toHaveLength(2)
    expect(results[0]?.outcome).toBe('new')
    expect(results[1]?.outcome).toBe('duplicate_in_batch')
  })
})

describe('classifyEntries — fuzzy match (review pair)', () => {
  it('flags an incoming entry matching existing on (date + IOR) but different number as fuzzy_review_pair', () => {
    const results = classifyEntries(
      [
        incoming({
          rawEntryNumber: 'XYZ-7654321-9',
          entryDate: '2024-08-15',
          importerOfRecord: 'Acme Imports LLC',
        }),
      ],
      [EXISTING_ENTRY],
    )
    const r = findOne(results, 'XYZ-7654321-9')
    expect(r.outcome).toBe('fuzzy_review_pair')
    expect(r.matchedEntry?.entryNumber).toBe('ABC-1234567-8')
  })

  it('IOR comparison is case-insensitive + whitespace-insensitive', () => {
    const results = classifyEntries(
      [
        incoming({
          rawEntryNumber: 'XYZ-7654321-9',
          importerOfRecord: '  acme imports llc  ',
        }),
      ],
      [EXISTING_ENTRY],
    )
    expect(findOne(results, 'XYZ-7654321-9').outcome).toBe('fuzzy_review_pair')
  })

  it('different date but same IOR → new (date is part of the fuzzy key)', () => {
    const results = classifyEntries(
      [incoming({ rawEntryNumber: 'XYZ-7654321-9', entryDate: '2024-12-01' })],
      [EXISTING_ENTRY],
    )
    expect(findOne(results, 'XYZ-7654321-9').outcome).toBe('new')
  })

  it('different IOR but same date → new', () => {
    const results = classifyEntries(
      [incoming({ rawEntryNumber: 'XYZ-7654321-9', importerOfRecord: 'Other Co' })],
      [EXISTING_ENTRY],
    )
    expect(findOne(results, 'XYZ-7654321-9').outcome).toBe('new')
  })

  it('missing date or IOR on the incoming entry → cannot fuzzy-match → new', () => {
    const noDate = classifyEntries(
      [incoming({ rawEntryNumber: 'XYZ-7654321-9', entryDate: undefined })],
      [EXISTING_ENTRY],
    )
    expect(findOne(noDate, 'XYZ-7654321-9').outcome).toBe('new')
    const noIor = classifyEntries(
      [incoming({ rawEntryNumber: 'XYZ-7654321-9', importerOfRecord: undefined })],
      [EXISTING_ENTRY],
    )
    expect(findOne(noIor, 'XYZ-7654321-9').outcome).toBe('new')
  })
})

describe('classifyEntries — new entries', () => {
  it('returns new for an incoming entry with no canonical or fuzzy match', () => {
    const results = classifyEntries(
      [
        incoming({
          rawEntryNumber: 'QRS-1111111-2',
          entryDate: '2024-12-01',
          importerOfRecord: 'Other Co',
        }),
      ],
      [EXISTING_ENTRY],
    )
    expect(findOne(results, 'QRS-1111111-2').outcome).toBe('new')
  })
})

describe('classifyEntries — invalid entry numbers', () => {
  it('marks entries that fail canonicalization as invalid; preserves the canonicalResult for the analyst', () => {
    const results = classifyEntries(
      [incoming({ rawEntryNumber: 'gibberish' })],
      [EXISTING_ENTRY],
    )
    const r = findOne(results, 'gibberish')
    expect(r.outcome).toBe('invalid')
    expect(r.canonicalResult.ok).toBe(false)
  })

  it('does not crash on an empty input', () => {
    expect(classifyEntries([], [EXISTING_ENTRY])).toEqual([])
  })
})

describe('classifyEntries — ordering', () => {
  it('exact match wins over fuzzy match', () => {
    // Set up: existing has both an exact-canonical match and a
    // fuzzy match. Incoming should be flagged exact_duplicate.
    const fuzzyOnly: ExistingEntry = {
      entryNumber: 'XYZ-7654321-9',
      entryDate: '2024-08-15',
      importerOfRecord: 'Acme Imports LLC',
    }
    const exactMatch: ExistingEntry = {
      entryNumber: 'ABC-1234567-8',
      entryDate: '2024-08-15',
      importerOfRecord: 'Acme Imports LLC',
    }
    const results = classifyEntries(
      [
        incoming({
          rawEntryNumber: 'abc-1234567-8',
          entryDate: '2024-08-15',
          importerOfRecord: 'Acme Imports LLC',
        }),
      ],
      [fuzzyOnly, exactMatch],
    )
    const r = findOne(results, 'abc-1234567-8')
    expect(r.outcome).toBe('exact_duplicate')
    expect(r.matchedEntry?.entryNumber).toBe('ABC-1234567-8')
  })
})
