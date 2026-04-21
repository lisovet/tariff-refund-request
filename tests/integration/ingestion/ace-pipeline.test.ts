import { describe, expect, it } from 'vitest'
import {
  CURRENT_IEEPA_WINDOW,
  classifyEntries,
  parseAceCsv,
  tagEntry,
  type AceEntryCandidate,
  type IncomingEntry,
} from '@contexts/entries'

/**
 * Composition test for task #60 (USER-TEST): exercises parseAceCsv →
 * classifyEntries → tagEntry as a single ingestion pipeline against
 * a representative synthetic ACE fixture.
 *
 * The fixture is deliberately small + readable: a header, a few
 * valid rows (in-window + out-of-window), a duplicate of a previously
 * existing entry, a row with the same date+IOR but different entry
 * number (fuzzy review pair candidate), and an intentionally-bad row.
 */

const ACE_FIXTURE = [
  'Entry No,Entry Date,IOR,Total Duty,HTS',
  // 1. In-window, brand new
  'ABC-1234567-8,2024-08-15,Acme Imports LLC,2500.00,8471.30.0100',
  // 2. In-window, duplicates an existing entry (caller will see exact_duplicate)
  'XYZ-7654321-9,2024-09-01,Acme Imports LLC,1200.00,8542.31.0001',
  // 3. In-window, same (date,IOR) as the EXISTING XYZ entry but
  //    different entry number — fuzzy_review_pair against existing
  'QQQ-1111111-2,2024-09-01,Acme Imports LLC,500.00,8471.30.0100',
  // 4. Pre-window — should tag inWindow=false
  'DEF-2222222-3,2023-01-15,Acme Imports LLC,800.00,8471.30.0100',
  // 5. Post-window
  'GHI-3333333-4,2026-12-15,Acme Imports LLC,400.00,8471.30.0100',
  // 6. Malformed — parser should drop + record an error row
  'gibberish,August 2024,Acme Imports LLC,not-a-number,8471.30.0100',
].join('\n')

const EXISTING_ENTRIES = [
  {
    entryNumber: 'XYZ-7654321-9',
    entryDate: '2024-09-01',
    importerOfRecord: 'Acme Imports LLC',
  },
] as const

describe('ACE ingestion pipeline — parse → classify → window-tag', () => {
  it('parses the fixture and surfaces the bad row as a per-row error', () => {
    const parsed = parseAceCsv(ACE_FIXTURE)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error('unreachable')

    expect(parsed.rows).toHaveLength(5) // 6 data rows minus the gibberish row
    expect(parsed.errors).toHaveLength(1)
    expect(parsed.errors[0]?.row).toBe(7) // header=1, then 6 data rows; gibberish is the 6th data row → CSV row 7
    expect(parsed.errors[0]?.field).toBe('entryNumber')
  })

  it('every parsed row gets sourceConfidence=high (ACE is the cleanest signal per PRD 07)', () => {
    const parsed = parseAceCsv(ACE_FIXTURE)
    if (!parsed.ok) throw new Error('unreachable')
    for (const row of parsed.rows) {
      expect(row.sourceConfidence).toBe('high')
    }
  })

  it('classifyEntries produces the expected mix of new / exact_duplicate / fuzzy_review_pair', () => {
    const parsed = parseAceCsv(ACE_FIXTURE)
    if (!parsed.ok) throw new Error('unreachable')

    const incoming: IncomingEntry[] = parsed.rows.map(toIncomingEntry)
    const classified = classifyEntries(incoming, EXISTING_ENTRIES)

    const byEntryNumber = new Map(classified.map((c) => [c.incoming.rawEntryNumber, c]))

    expect(byEntryNumber.get('ABC-1234567-8')?.outcome).toBe('new')
    expect(byEntryNumber.get('XYZ-7654321-9')?.outcome).toBe('exact_duplicate')
    expect(byEntryNumber.get('QQQ-1111111-2')?.outcome).toBe('fuzzy_review_pair')
    // Out-of-window entries are still "new" from a dedupe standpoint —
    // window status is a separate concern handled by tagEntry below.
    expect(byEntryNumber.get('DEF-2222222-3')?.outcome).toBe('new')
    expect(byEntryNumber.get('GHI-3333333-4')?.outcome).toBe('new')
  })

  it('tagEntry separates in-window rows from out-of-window rows; pins the window version on every result', () => {
    const parsed = parseAceCsv(ACE_FIXTURE)
    if (!parsed.ok) throw new Error('unreachable')

    const tagged = parsed.rows.map((row) => ({
      row,
      tag: tagEntry({ entryDate: row.entryDate }, CURRENT_IEEPA_WINDOW),
    }))

    const inWindow = tagged.filter((t) => t.tag.inWindow)
    const outOfWindow = tagged.filter((t) => !t.tag.inWindow)

    expect(inWindow).toHaveLength(3) // ABC, XYZ, QQQ
    expect(outOfWindow).toHaveLength(2) // DEF (pre-window), GHI (post-window)

    for (const t of tagged) {
      expect(t.tag.windowVersion).toBe(CURRENT_IEEPA_WINDOW.version)
    }

    // In-window rows carry a phaseFlag.
    for (const t of inWindow) {
      expect(t.tag.phaseFlag).toBeTruthy()
    }
    // Out-of-window rows carry phaseFlag=null but version is still pinned.
    for (const t of outOfWindow) {
      expect(t.tag.phaseFlag).toBeNull()
    }
  })
})

function toIncomingEntry(row: AceEntryCandidate): IncomingEntry {
  return {
    rawEntryNumber: row.entryNumber,
    entryDate: row.entryDate,
    importerOfRecord: row.importerOfRecord,
  }
}
