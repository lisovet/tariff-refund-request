# Ralph Loop Status

**Updated**: 2026-04-21T10:01:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 37 → 38)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 37 |
| in-progress | 0 |
| pending | 49 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 61 files, 433 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 19 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#41 — Case service — `transition()` with audit logging**

- `CaseRepo` contract (`createCase` / `findCase` / `recordTransition` / `listAudit`) with two implementations: in-memory (tests + dev) and Drizzle (Postgres).
- `recordTransition` is the single transactional write per PRD 04 — `UPDATE cases.state` + `INSERT audit_log` in `db.transaction()`. The UPDATE includes `WHERE state = $from` for optimistic concurrency; a stale caller fails the row-count check and the whole tx rolls back with a clear `drifted` error.
- `transition({ caseId, event, actor }, deps)` loads the case, runs the machine to compute next state, distinguishes `invalid_transition` from `guard_rejected` (synthetic-validator probe on `VALIDATOR_SIGNED_OFF`), persists via the repo, then publishes `platform/case.state.transitioned`.
- Publish failure does NOT roll back the DB write — the transition has happened; Inngest retries are observable. Tested explicitly.
- Actor enrichment: callers can pass actor on the input; `transition()` lifts it onto the event for `VALIDATOR_SIGNED_OFF` so the guard sees it.
- `payload` column on `audit_log` strips the actor field (PII lives on `actorId`, not the payload blob).
- Public surface: `transition` + types via `@contexts/ops`; `getCaseRepo` + drizzle factory via `@contexts/ops/server`.
- 10 new tests covering happy path, case_not_found, invalid_transition, guard_rejected (analyst denied at batch_qa), publish-failure-does-not-rollback, actor enrichment, in-memory invariants (initial state, stale-from rejection, audit ordering).

## Human-verification still owes

- Apply `0003_cases_audit_log.sql` to a real Postgres and confirm the audit-log RLS DELETE-deny policy holds against `transition()` invocations.
- Decide whether `transition()` should also write a structured-log line (in addition to publishing the Inngest event) when the publish callback throws — currently the throw bubbles up to the caller.

## Next eligible

Per dependency check (v1 only):
- Task #42 (Inngest events on every transition — wires the callback for routes/workflows) — deps `[41]` satisfied. **Eligible — lowest id.**
- Task #44 (documents + recovery_sources schema) — deps satisfied.
- Task #49 (recovery routing — broker vs DIY) — deps satisfied.
- Task #67 (CAPE prep workflow scaffold) — deps satisfied.
- Task #72 (admin dashboard scaffold) — deps satisfied.

Lowest-id eligible is **task #42**.

## Notes

- Wave 7 (Case state machine + audit log) 3/several done.
- Loop will continue with task #42 next iteration.
