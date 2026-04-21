# Ralph Loop Status

**Updated**: 2026-04-21T10:25:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 41 → 42)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 41 |
| in-progress | 0 |
| pending | 45 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 67 files, 484 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 21 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#45 — Pre-signed upload endpoint + client**

Two-step flow per PRD 02 to avoid orphan rows on mid-flight failures:

1. **`POST /api/uploads`** — validates the request (case-id segment shape, filename safety, content-type allowlist, byteSize cap 50 MB), generates `documentId`, builds the canonical case-scoped storage key, returns a 15-minute pre-signed PUT URL. **No DB write.**
2. **`POST /api/uploads/complete`** — verifies the object landed via `headObject()`, inserts the document row using the bucket-reported size (not the client's). UNIQUE (case_id, sha256) dedup surfaces as `outcome: duplicate_sha256` with the existing document — never a hard error.

- Content-type allowlist: PDF / XLSX / XLS / CSV / EML. No images; paper scans deferred to Phase 2 OCR per PRD 07.
- Status code map: 400 invalid body / caseId / filename, 413 byte_size_too_large, 409 object_not_uploaded.
- Recovery context public-surface split: pure validators + service via `@contexts/recovery`; storage adapter + Drizzle repo via `@contexts/recovery/server`.
- Document repo has two implementations: in-memory (tests) + Drizzle (Postgres). Drizzle repo is race-aware — catches the unique-violation and re-looks-up the existing row.
- `MAX_UPLOAD_URL_EXPIRY_SECONDS` now re-exported from `shared/infra/storage` barrel (was missing).
- `/api/uploads` is already in `PROTECTED_PREFIXES` (middleware-gated).
- 34 new tests (16 validator + 10 service + 8 integration route tests).

## Human-verification still owes

- Provision real R2 bucket; set `R2_*` env vars; upload a real file end-to-end; confirm the pre-signed URL works from the browser with the CORS policy R2 needs.
- Enforce per-customer quota for paid-service tier (PRD 02 edge case). v1 scaffolding is open to all authenticated users; rate-limit / quota middleware lands with task #83 (ops console) or earlier if needed.
- Wire the upload client component into the recovery workspace (task #51).

## Next eligible

Per dependency check (v1 only):
- Task #46 — deps satisfied. **Eligible — lowest id.**
- Task #47 — eligible.
- Task #49 (recovery routing — broker vs DIY) — eligible.
- Task #55 (entries schema) — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.

Lowest-id eligible is **task #46**.

## Notes

- Wave 8 (Recovery context) 2/many done.
- Loop will continue with #46 next iteration.
