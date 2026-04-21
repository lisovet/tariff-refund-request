# Ralph Loop Status

**Updated**: 2026-04-21T12:50:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 62 → 63)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 63 |
| in-progress | 0 |
| pending | 23 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 92 files, 764 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 24 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#63 — CBP-compliant CSV builder**

`buildCapeCsv({ caseId, batchId, generatedAt, entries, readinessReport })` → `{ ok:true, csv, filename } | { ok:false, reason: blocking_issues_present | no_entries | invalid_entry, ... }`.

- **Hard rules:**
  - REJECTS when `readinessReport.blockingCount > 0`.
  - REJECTS when entries is empty.
  - REJECTS when any entry fails `CapeEntryRowSchema` (defense in depth — guards against an in-process producer that bypassed the validator).
- **Layout:**
  - Every cell is quoted. Excel strips leading zeros from unquoted numeric-looking strings; CBP entry numbers and HTS codes routinely have leading zeros, so quoting is non-negotiable.
  - Multi-value HTS uses `;` separators inside the quoted cell (single row per entry).
  - Duty rendered as 2-decimal dollars from cents.
  - **CRLF line endings** — CBP intake accepts CRLF; some legacy systems reject LF-only.
  - Filename pattern: `cape-{caseId}-{batchId}-{yyyymmdd}.csv`.
- `CAPE_CSV_HEADERS` frozen array (snake_case): `id, entry_number, entry_date, importer_of_record, duty_amount_usd, hts_codes, phase_flag, window_version, source_confidence`.
- 12 new tests including a byte-for-byte golden-output match.

## Human-verification still owes

- Confirm CBP intake accepts the quoted-cell format we produce — test against the real CBP CAPE upload endpoint with a known-good fixture.
- Decide whether the v1 CSV needs every PRD-03 column or a CBP-mandated minimum — the current header set is what `CapeEntryRowSchema` exposes; CBP may require additional columns (entry-type code, port code) that v1 doesn't capture yet.
- Wire `buildCapeCsv` into a `GET /api/cases/[id]/cape/csv` route once the case-machine reaches `submission_ready` (lands in #64 + #82).

## Next eligible

Per dependency check (v1 only):
- Task #64 — deps satisfied. **Eligible — lowest id.**
- Task #65 — eligible.
- Task #67 — eligible.
- Task #72 — eligible.
- Task #74 — eligible.

Lowest-id eligible is **task #64**.

## Notes

- 63/86 v1 done — 73.3% of Phase 0.
- Wave 10 (CAPE schema + validator + CSV) complete.
- Loop will continue with #64 next iteration.
