# Ralph Loop Status

**Updated**: 2026-04-21T12:57:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 63 → 64)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 64 |
| in-progress | 0 |
| pending | 22 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 93 files, 779 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 24 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#64 — Batch entity + grouping logic**

- Schema (`drizzle/0007_batches.sql`):
  - `batches` (id `bat_*`, caseId FK→cases RESTRICT NOT NULL, label, phaseFlag, status enum default `draft`, validationRunId, createdAt/updatedAt + indexes on `(case, time)` + `status`).
  - `batch_entries` link table (batchId FK→batches CASCADE, entryId FK→entries RESTRICT, position int 1-indexed for ordered membership, addedAt + composite PK + indexes on `(batch, position)` and `entry`).
  - Migration name normalized in `_journal.json`.
- Pure `suggestBatches(entries, opts) → BatchSuggestion[]`:
  - Groups entries by `phaseFlag` (preserves input order within group).
  - Chunks each phase by `maxBatchSize` (`DEFAULT_MAX_BATCH_SIZE = 100`).
  - Deterministic output sorted by phase id.
  - `isOversized=true` on every chunk of a split phase (the split is the signal).
  - Labels: single chunk → `"phase_a — N entries"` (singular/plural correct); split → `"phase_a — Group N of M (NN entries)"`.
- 15 new tests covering grouping, multi-phase output, order preservation, threshold splitting, default threshold, sub-threshold sibling preservation, single vs multi-chunk labels, deterministic phase ordering, empty input, non-positive threshold rejection, oversized flag semantics.

## Human-verification still owes

- Tune `DEFAULT_MAX_BATCH_SIZE` (currently 100) once we see real customer batch volumes — this is a placeholder value.
- Decide whether grouping should also factor entry-date ordering inside a phase (currently only input-order is preserved).
- Wire the batch-suggestion + persistence into the ops console once #82 lands; the schema is ready, the service layer (BatchRepo with `createBatchFromSuggestion`) is the next piece.

## Next eligible

Per dependency check (v1 only):
- Task #65 — deps satisfied. **Eligible — lowest id.**
- Task #67 — eligible.
- Task #72 — eligible.
- Task #74 — eligible.
- Task #75 — eligible.

Lowest-id eligible is **task #65** — Readiness Report PDF.

## Notes

- 64/86 v1 done — 74.4% of Phase 0.
- Wave 10 (CAPE schema + validator + CSV) complete; batches schema landed.
- Loop will continue with #65 next iteration.
