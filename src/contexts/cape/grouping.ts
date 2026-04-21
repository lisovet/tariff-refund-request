/**
 * Batch grouping suggestion per PRD 03.
 *
 * Standard tier surfaces the suggested grouping as info; Premium
 * tier auto-creates the batches. The persistence step (creating
 * `batches` rows) lives behind the recovery service; this module is
 * the pure decision function.
 *
 * Algorithm:
 *   1. Group entries by phaseFlag (preserves input order within a
 *      group so the analyst sees a stable batch).
 *   2. For each phase, chunk the entries into batches of at most
 *      `maxBatchSize`.
 *   3. Output is sorted by phase id (deterministic), then by the
 *      chunk index inside a phase.
 */

export const DEFAULT_MAX_BATCH_SIZE = 100

export interface GroupableEntry {
  readonly id: string
  readonly phaseFlag: string
}

export interface BatchSuggestion {
  readonly phaseFlag: string
  readonly entryRecordIds: readonly string[]
  readonly label: string
  /**
   * True when the chunk size hit the threshold cap — the analyst
   * should sanity-check the split. Single-batch phases that fit
   * cleanly under the threshold are NOT oversized.
   */
  readonly isOversized: boolean
}

export interface SuggestBatchesOptions {
  readonly maxBatchSize?: number
}

export function suggestBatches(
  entries: readonly GroupableEntry[],
  options: SuggestBatchesOptions = {},
): readonly BatchSuggestion[] {
  const maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE
  if (!Number.isFinite(maxBatchSize) || maxBatchSize <= 0) {
    throw new Error(
      `suggestBatches: maxBatchSize must be a positive integer, got ${maxBatchSize}`,
    )
  }
  if (entries.length === 0) return []

  const byPhase = new Map<string, string[]>()
  for (const entry of entries) {
    let bucket = byPhase.get(entry.phaseFlag)
    if (!bucket) {
      bucket = []
      byPhase.set(entry.phaseFlag, bucket)
    }
    bucket.push(entry.id)
  }

  const suggestions: BatchSuggestion[] = []
  const sortedPhases = [...byPhase.keys()].sort()

  for (const phase of sortedPhases) {
    const ids = byPhase.get(phase) as string[]
    const chunks = chunk(ids, maxBatchSize)
    chunks.forEach((chunkIds, i) => {
      const isMultiChunk = chunks.length > 1
      const isOversized = isMultiChunk
      const label = isMultiChunk
        ? `${phase} — Group ${i + 1} of ${chunks.length} (${chunkIds.length} entries)`
        : `${phase} — ${chunkIds.length} ${chunkIds.length === 1 ? 'entry' : 'entries'}`
      suggestions.push({
        phaseFlag: phase,
        entryRecordIds: chunkIds,
        label,
        isOversized,
      })
    })
  }

  return suggestions
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}
