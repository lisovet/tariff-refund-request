import { canonicalizeEntryNumber, type CanonicalEntryNumberResult } from './canonicalize'

/**
 * Dedupe + fuzzy match per PRD 07.
 *
 *   exact_duplicate     — incoming canonical entry number matches an
 *                         existing entry. Caller should NOT insert a
 *                         new entry; instead attach a second source
 *                         to the matched entry (PRD 07 acceptance).
 *   duplicate_in_batch  — same canonical number repeats inside the
 *                         incoming list (after the first occurrence).
 *                         First copy lands; subsequent copies are
 *                         attach-second-source.
 *   fuzzy_review_pair   — same date AND same IOR as an existing
 *                         entry but DIFFERENT canonical number.
 *                         Both records kept; analyst review
 *                         queue surfaces the pair.
 *   new                 — no match. Insert.
 *   invalid             — incoming raw entry number failed
 *                         canonicalization. Caller surfaces in the
 *                         manual-correction queue.
 *
 * Pure function. The ingestion service in #58+ composes this with
 * the entries repo to produce DB writes.
 */

export type DedupeOutcome =
  | 'exact_duplicate'
  | 'duplicate_in_batch'
  | 'fuzzy_review_pair'
  | 'new'
  | 'invalid'

export interface IncomingEntry {
  readonly rawEntryNumber: string
  readonly entryDate?: string | null
  readonly importerOfRecord?: string | null
}

export interface ExistingEntry {
  /** Canonical FFF-SSSSSSS-C. */
  readonly entryNumber: string
  readonly entryDate?: string | null
  readonly importerOfRecord?: string | null
}

export interface ClassifiedEntry {
  readonly incoming: IncomingEntry
  readonly canonicalResult: CanonicalEntryNumberResult
  readonly outcome: DedupeOutcome
  readonly matchedEntry?: ExistingEntry
}

export function classifyEntries(
  incoming: readonly IncomingEntry[],
  existing: readonly ExistingEntry[],
): readonly ClassifiedEntry[] {
  const existingByCanonical = new Map<string, ExistingEntry>()
  for (const e of existing) existingByCanonical.set(e.entryNumber, e)

  const fuzzyIndex = new Map<string, ExistingEntry>()
  for (const e of existing) {
    const key = fuzzyKey(e.entryDate, e.importerOfRecord)
    if (key) fuzzyIndex.set(key, e)
  }

  const seenInBatch = new Set<string>()
  const results: ClassifiedEntry[] = []

  for (const inc of incoming) {
    const canonicalResult = canonicalizeEntryNumber(inc.rawEntryNumber)
    if (!canonicalResult.ok) {
      results.push({ incoming: inc, canonicalResult, outcome: 'invalid' })
      continue
    }
    const canonical = canonicalResult.canonical

    const existingMatch = existingByCanonical.get(canonical)
    if (existingMatch) {
      results.push({
        incoming: inc,
        canonicalResult,
        outcome: 'exact_duplicate',
        matchedEntry: existingMatch,
      })
      continue
    }

    if (seenInBatch.has(canonical)) {
      results.push({ incoming: inc, canonicalResult, outcome: 'duplicate_in_batch' })
      continue
    }
    seenInBatch.add(canonical)

    const incomingFuzzyKey = fuzzyKey(inc.entryDate, inc.importerOfRecord)
    if (incomingFuzzyKey) {
      const fuzzyMatch = fuzzyIndex.get(incomingFuzzyKey)
      if (fuzzyMatch && fuzzyMatch.entryNumber !== canonical) {
        results.push({
          incoming: inc,
          canonicalResult,
          outcome: 'fuzzy_review_pair',
          matchedEntry: fuzzyMatch,
        })
        continue
      }
    }

    results.push({ incoming: inc, canonicalResult, outcome: 'new' })
  }

  return results
}

/**
 * Build a fuzzy-match key from date + IOR. Returns undefined when
 * either field is missing — a fuzzy match requires both halves.
 */
function fuzzyKey(
  date: string | null | undefined,
  ior: string | null | undefined,
): string | undefined {
  if (!date || date.trim().length === 0) return undefined
  if (!ior || ior.trim().length === 0) return undefined
  const normalizedIor = ior.trim().toLowerCase().replace(/\s+/g, ' ')
  return `${date.trim()}__${normalizedIor}`
}
