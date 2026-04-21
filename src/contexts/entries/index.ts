/**
 * Entries context — public surface.
 *
 * Pure module at v1: just canonicalization helpers. Entry persistence
 * lives in `@contexts/recovery` (alongside provenance) per ADR 001's
 * bounded-context layout, since the entry lifecycle starts in
 * recovery and ends in CAPE prep.
 */

export type { CanonicalEntryNumberResult } from './canonicalize'
export {
  CANONICAL_ENTRY_NUMBER_RE,
  canonicalizeEntryNumber,
  formatCanonicalEntryNumber,
} from './canonicalize'

export type {
  ClassifiedEntry,
  DedupeOutcome,
  ExistingEntry,
  IncomingEntry,
} from './dedupe'
export { classifyEntries } from './dedupe'
