# Ralph Loop Status

**Updated**: 2026-04-21T11:55:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 53 → 54)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 54 |
| in-progress | 0 |
| pending | 32 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 84 files, 637 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 24 routes |
| `npm run qa` (combined) | green |

## Last completed tasks (this iteration)

**#53 — Manual entry-extraction form + provenance write** *(also satisfies #55 schema work)*

- Schema (drizzle/0006_entries_provenance.sql):
  - `entries` (id `ent_*`, caseId FK→cases RESTRICT NOT NULL, entryNumber, entryDate, importerOfRecord, dutyAmountUsdCents bigint, htsCodes text[], phaseFlag, validatedAt/validatedBy, createdAt/updatedAt) + UNIQUE(case_id, entry_number) for canonical dedupe + index on (case, time).
  - `entry_source_records` (id `esrc_*`, entryId FK→entries RESTRICT NOT NULL, **recoverySourceId FK→recovery_sources RESTRICT NOT NULL** — provenance never null per `.ralph/PROMPT.md`, rawData jsonb, confidence enum default pending, extractedAt/extractedBy + indexes).
- `EntriesRepo` (in-memory + Drizzle) with `saveExtractedEntry` transactional contract — entry + source insert run inside a single `db.transaction()`.
- Service `saveExtractedEntry` composes entry write + audit log row (`kind=entry.extracted` on first save; `kind=entry.source_attached` on the second-source path).
- POST `/api/cases/[id]/entries` route: Zod-validated body, 400 on bad body, 404 on missing case, 200 with outcome + entry + sourceRecord + auditId.
- `ExtractionFormPanel` wired to POST when no `onSave` seam — requires `recoverySourceId` prop; shows error state if missing.
- 12 new tests (6 service + 6 integration route); existing form tests adapted to async save.

**#55 — Entry record schema** *(landed inside #53)*

Tables + indexes per PRD 07. Integration tests in #53 cover valid-insert + duplicate-attaches-second-source.

## Human-verification still owes

- Apply `0006_entries_provenance.sql` to a real Postgres; insert two entries with the same (case_id, entry_number) and confirm the second hits the unique constraint at the DB level.
- End-to-end walk: ops user opens `/ops/case/[id]`, picks a doc, fills the form, saves; confirm an entry row + source record + audit row land.
- Wire the `ExtractionFormPanel` `recoverySourceId` prop dynamically from the active document in `DocumentViewerPanel` (currently a static prop — the wiring needs a recovery_source row creation step which lands with task #54+).

## Next eligible

Per dependency check (v1 only):
- Task #54 — deps satisfied. **Eligible — lowest id.**
- Task #56 — eligible.
- Task #61 — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.
- Task #72 (admin dashboard scaffold) — eligible.

Lowest-id eligible is **task #54**.

## Notes

- 54/86 v1 done — past 60% of Phase 0.
- Wave 8 (Recovery context) + Wave 9 (Entry ingestion schema) substantially complete.
- Loop will continue with #54 next iteration.
