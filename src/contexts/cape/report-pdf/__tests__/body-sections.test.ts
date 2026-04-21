import { describe, expect, it } from 'vitest'
import {
  HeroMetric,
  type HeroMetricProps,
} from '../HeroMetric'
import {
  EntryTable,
  STATUS_GLYPHS,
  type EntryTableRow,
} from '../EntryTable'
import {
  PrerequisitesList,
  type PrerequisitesListProps,
} from '../PrerequisitesList'

/**
 * Task #68 — body-section components for the Readiness Report PDF.
 *
 * These components are @react-pdf/renderer Views (NOT DOM nodes), so
 * the tests assert on the returned React element tree + any pure
 * helpers (e.g., STATUS_GLYPHS, formatters). The photographable
 * golden rendering is covered in report.test.ts.
 */

describe('HeroMetric', () => {
  const PROPS: HeroMetricProps = {
    totalEntries: 42,
    blockingCount: 0,
    warningCount: 2,
    infoCount: 1,
  }

  it('returns a truthy element for any valid counts', () => {
    expect(HeroMetric(PROPS)).toBeTruthy()
    expect(HeroMetric({ totalEntries: 0, blockingCount: 0, warningCount: 0, infoCount: 0 })).toBeTruthy()
  })

  it('returns a truthy element when the batch is blocking-heavy', () => {
    expect(
      HeroMetric({ totalEntries: 7, blockingCount: 3, warningCount: 0, infoCount: 0 }),
    ).toBeTruthy()
  })
})

describe('EntryTable', () => {
  const ROW_CLEAN: EntryTableRow = {
    id: 'ent_1',
    entryNumber: '123-4567890-1',
    entryDate: '2024-09-01',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 125_000,
    status: 'ok',
    notes: [],
  }
  const ROW_WARNING: EntryTableRow = {
    id: 'ent_2',
    entryNumber: '123-4567890-2',
    entryDate: '2024-09-02',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 0,
    status: 'warning',
    notes: ['Low source confidence.'],
  }
  const ROW_BLOCKING: EntryTableRow = {
    id: 'ent_3',
    entryNumber: '123-4567890-3',
    entryDate: '2024-09-03',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 750_000,
    status: 'blocking',
    notes: ['Missing IOR.', 'Outside IEEPA window.'],
  }

  it('returns a truthy element for a full row set', () => {
    expect(EntryTable({ rows: [ROW_CLEAN, ROW_WARNING, ROW_BLOCKING] })).toBeTruthy()
  })

  it('returns a truthy element for an empty batch (no rows, just the header)', () => {
    expect(EntryTable({ rows: [] })).toBeTruthy()
  })

  describe('STATUS_GLYPHS', () => {
    it('maps every EntryStatus to a single visible character', () => {
      expect(STATUS_GLYPHS.ok.length).toBeGreaterThan(0)
      expect(STATUS_GLYPHS.warning.length).toBeGreaterThan(0)
      expect(STATUS_GLYPHS.blocking.length).toBeGreaterThan(0)
    })

    it('uses distinct glyphs per status (no accidental collisions)', () => {
      const values = new Set(Object.values(STATUS_GLYPHS))
      expect(values.size).toBe(3)
    })

    it('ok / warning / blocking glyphs follow the editorial palette (no emoji)', () => {
      for (const g of Object.values(STATUS_GLYPHS)) {
        // emoji code points start at U+1F000+; reject any surrogate
        // pair signalling a pictographic glyph.
        expect(/[\uD800-\uDBFF]/.test(g)).toBe(false)
      }
    })
  })
})

describe('PrerequisitesList', () => {
  const PROPS: PrerequisitesListProps = {
    prerequisites: [
      { id: 'ior_on_file', label: 'IOR on file', met: true },
      { id: 'ach_on_file', label: 'ACH on file', met: false },
      { id: 'ace_access', label: 'ACE access confirmed', met: true },
    ],
  }

  it('returns a truthy element for a mixed-met prerequisites set', () => {
    expect(PrerequisitesList(PROPS)).toBeTruthy()
  })

  it('returns a truthy element for an empty prerequisites set (nothing to show)', () => {
    expect(PrerequisitesList({ prerequisites: [] })).toBeTruthy()
  })

  it('returns a truthy element when every prerequisite is met', () => {
    expect(
      PrerequisitesList({
        prerequisites: PROPS.prerequisites.map((p) => ({ ...p, met: true })),
      }),
    ).toBeTruthy()
  })
})
