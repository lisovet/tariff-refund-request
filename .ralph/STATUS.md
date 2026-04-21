# Ralph Loop Status

**Updated**: 2026-04-21T12:25:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 58 → 59)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 59 |
| in-progress | 0 |
| pending | 27 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 88 files, 701 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 24 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#59 — ACE CSV parser**

- `parseAceCsv(csv)` → `AceParseResult` discriminated union: `{ ok:true, rows: AceEntryCandidate[], errors: AceParseError[] }` on header-validated CSV; `{ ok:false, reason:'missing_columns', missingColumns: AceColumnKey[] }` when a required column is missing.
- **Permissive header normalization** (trim + lowercase + `_` → space; synonyms accept "Entry No" / "Entry Number" / "Entry_No", "Total Duty" / "Total Duty (USD)", etc.) but **strict per-row validation**:
  - entry-number canonicalized via `canonicalizeEntryNumber` (any failure → `field=entryNumber`)
  - date must be `YYYY-MM-DD` ISO
  - IOR must be non-empty
  - duty parsed from `$`-prefixed/comma-separated dollar string to non-negative cents
  - HTS codes split on `;` / `,` / whitespace and validated against the 4.2.4 digit-dot pattern
- Source confidence stamped `'high'` per PRD 07 source hierarchy (ACE export is the cleanest signal).
- Per-row failures collected as `AceParseError { row, field, reason }` with the CSV-row line number (header is row 1) so the analyst review queue can show exactly which row failed.
- `papaparse@^5.5` + `@types/papaparse` added.
- 16 new tests covering single + multi-row happy paths, header variants (4 forms), missing-column rejection, per-row errors, multi-error reporting alongside valid rows, empty input, header-only input, Excel-stripped leading-zero filer codes.

## Human-verification still owes

- Run against an anonymized real ACE export from a customer to validate header-name coverage; add any missing synonyms.
- Decide whether HTS codes that don't match the 4.2.4 digit-dot pattern (e.g., partial codes) should be soft-flagged rather than reject the whole row.
- Wire `parseAceCsv` into the upload pipeline once the storage adapter can stream + the case-aware ingest service exists (#62+).

## Next eligible

Per dependency check (v1 only):
- Task #60 — deps satisfied. **Eligible — lowest id.**
- Task #61 — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.
- Task #72 (admin dashboard scaffold) — eligible.
- Task #74 — eligible.

Lowest-id eligible is **task #60**.

## Notes

- 59/86 v1 done.
- Wave 9 (Entry ingestion + normalization) — schema + canonicalizer + dedupe + window-tagging + ACE parser landed.
- Loop will continue with #60 next iteration.
