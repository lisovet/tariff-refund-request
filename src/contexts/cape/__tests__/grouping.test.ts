import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAX_BATCH_SIZE,
  type BatchSuggestion,
  type GroupableEntry,
  suggestBatches,
} from '../grouping'

function entry(id: string, phaseFlag: string): GroupableEntry {
  return { id, phaseFlag }
}

describe('suggestBatches — grouping by phase', () => {
  it('groups entries with the same phase into one batch', () => {
    const result = suggestBatches([
      entry('e1', 'phase_a'),
      entry('e2', 'phase_a'),
      entry('e3', 'phase_a'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.phaseFlag).toBe('phase_a')
    expect(result[0]?.entryRecordIds).toEqual(['e1', 'e2', 'e3'])
  })

  it('produces one batch per distinct phase', () => {
    const result = suggestBatches([
      entry('e1', 'phase_a'),
      entry('e2', 'phase_b'),
      entry('e3', 'phase_a'),
      entry('e4', 'phase_c'),
    ])
    expect(result).toHaveLength(3)
    const byPhase = new Map(result.map((b) => [b.phaseFlag, b]))
    expect(byPhase.get('phase_a')?.entryRecordIds).toEqual(['e1', 'e3'])
    expect(byPhase.get('phase_b')?.entryRecordIds).toEqual(['e2'])
    expect(byPhase.get('phase_c')?.entryRecordIds).toEqual(['e4'])
  })

  it('preserves entry order inside a batch (input order, not random)', () => {
    const result = suggestBatches([
      entry('z', 'phase_a'),
      entry('a', 'phase_a'),
      entry('m', 'phase_a'),
    ])
    expect(result[0]?.entryRecordIds).toEqual(['z', 'a', 'm'])
  })
})

describe('suggestBatches — splitting on size threshold', () => {
  it('splits a single phase into chunks of maxBatchSize', () => {
    const ids = Array.from({ length: 250 }, (_, i) => `e${i}`)
    const result = suggestBatches(
      ids.map((id) => entry(id, 'phase_a')),
      { maxBatchSize: 100 },
    )
    expect(result).toHaveLength(3) // 100 + 100 + 50
    expect(result[0]?.entryRecordIds).toHaveLength(100)
    expect(result[1]?.entryRecordIds).toHaveLength(100)
    expect(result[2]?.entryRecordIds).toHaveLength(50)
  })

  it('uses DEFAULT_MAX_BATCH_SIZE when none supplied', () => {
    const ids = Array.from({ length: DEFAULT_MAX_BATCH_SIZE + 5 }, (_, i) => `e${i}`)
    const result = suggestBatches(ids.map((id) => entry(id, 'phase_a')))
    expect(result).toHaveLength(2)
    expect(result[0]?.entryRecordIds).toHaveLength(DEFAULT_MAX_BATCH_SIZE)
    expect(result[1]?.entryRecordIds).toHaveLength(5)
  })

  it('sub-threshold phases stay as a single batch even when other phases split', () => {
    const result = suggestBatches(
      [
        ...Array.from({ length: 5 }, (_, i) => entry(`b${i}`, 'phase_b')),
        ...Array.from({ length: 250 }, (_, i) => entry(`a${i}`, 'phase_a')),
      ],
      { maxBatchSize: 100 },
    )
    const phaseB = result.filter((b) => b.phaseFlag === 'phase_b')
    expect(phaseB).toHaveLength(1)
    expect(phaseB[0]?.entryRecordIds).toHaveLength(5)

    const phaseA = result.filter((b) => b.phaseFlag === 'phase_a')
    expect(phaseA).toHaveLength(3)
  })
})

describe('suggestBatches — labels', () => {
  it('labels a single-batch phase without a "Group N of M" suffix', () => {
    const result = suggestBatches([entry('e1', 'phase_a')])
    expect(result[0]?.label).toBe('phase_a — 1 entry')
  })

  it('pluralizes the entry-count noun for multi-entry batches', () => {
    const result = suggestBatches([
      entry('e1', 'phase_a'),
      entry('e2', 'phase_a'),
    ])
    expect(result[0]?.label).toBe('phase_a — 2 entries')
  })

  it('adds "Group N of M" when a phase splits across multiple batches', () => {
    const ids = Array.from({ length: 250 }, (_, i) => `e${i}`)
    const result = suggestBatches(
      ids.map((id) => entry(id, 'phase_a')),
      { maxBatchSize: 100 },
    )
    expect(result[0]?.label).toBe('phase_a — Group 1 of 3 (100 entries)')
    expect(result[1]?.label).toBe('phase_a — Group 2 of 3 (100 entries)')
    expect(result[2]?.label).toBe('phase_a — Group 3 of 3 (50 entries)')
  })
})

describe('suggestBatches — output ordering', () => {
  it('sorts output batches by phase id (stable, deterministic)', () => {
    const result = suggestBatches([
      entry('e3', 'phase_z'),
      entry('e1', 'phase_a'),
      entry('e2', 'phase_m'),
    ])
    expect(result.map((b) => b.phaseFlag)).toEqual(['phase_a', 'phase_m', 'phase_z'])
  })
})

describe('suggestBatches — edge cases', () => {
  it('returns an empty array on empty input', () => {
    expect(suggestBatches([])).toEqual([])
  })

  it('throws when maxBatchSize is non-positive', () => {
    expect(() =>
      suggestBatches([entry('e1', 'phase_a')], { maxBatchSize: 0 }),
    ).toThrow(/maxBatchSize/)
    expect(() =>
      suggestBatches([entry('e1', 'phase_a')], { maxBatchSize: -1 }),
    ).toThrow(/maxBatchSize/)
  })
})

describe('BatchSuggestion shape', () => {
  it('every suggestion exposes phaseFlag, entryRecordIds, label, isOversized', () => {
    const result: readonly BatchSuggestion[] = suggestBatches([
      entry('e1', 'phase_a'),
    ])
    const b = result[0]
    expect(b?.phaseFlag).toBe('phase_a')
    expect(b?.entryRecordIds).toEqual(['e1'])
    expect(b?.label.length).toBeGreaterThan(0)
    expect(b?.isOversized).toBe(false)
  })

  it('marks every chunk of a split phase as oversized (the split is the signal)', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `e${i}`)
    const result = suggestBatches(
      ids.map((id) => entry(id, 'phase_a')),
      { maxBatchSize: 50 },
    )
    expect(result).toHaveLength(2)
    expect(result.every((b) => b.isOversized)).toBe(true)
  })

  it('does NOT flag a single-chunk phase as oversized even when it sits at the threshold', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `e${i}`)
    const result = suggestBatches(
      ids.map((id) => entry(id, 'phase_a')),
      { maxBatchSize: 50 },
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.isOversized).toBe(false)
  })
})
