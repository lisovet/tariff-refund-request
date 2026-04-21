# Ralph Loop Status

**Updated**: 2026-04-21T11:24:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 50 → 51)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 50 |
| in-progress | 0 |
| pending | 36 |
| human-blocked | 0 |

**50/86 v1 done.**

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 77 files, 599 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 22 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#30 — Stalled-case cadence (48h, 96h, day-7)**

- `STALLED_CADENCE_STAGES = [stalled-48h (48h), stalled-96h (48h), stalled-day-7 (72h)]` — additive timeouts hitting cumulative 48h / 96h / 168h milestones per PRD 04.
- `stalledCadenceWorkflow` listens on `platform/case.state.transitioned`. The handler short-circuits when `event.data.to !== "stalled"` so unrelated transitions burn no cadence work.
- For each stage: `step.waitForEvent` listens for the same event filtered by `async.data.caseId == "<id>" && async.data.from == "stalled"`. If no resumption arrives in the timeout window, `step.run` fires the cadence by appending a `stalled_cadence:<stage>` audit row (kind discriminator; `fromState=null`, `toState=null`).
- Resumption in any window stops the cadence with a stage-specific `cancelledBy` reason (`resumed-during-48h-window` / `…-96h-window` / `…-day-7-window`).
- `CaseRepo` extended with `appendAuditEntry(input)` — both in-memory and Drizzle implementations. The Drizzle path inserts directly without an UPDATE on `cases.state` (audit-only, no transition).
- Workflow registered in `shared/infra/inngest/workflows` + re-exported from `@contexts/ops/server`.
- 7 new tests covering happy path (3 fires + 3 audit rows), per-window cancellation, audit shape (fromState/toState null), and the caseId-scoped filter expression.

## Human-verification still owes

- Live workflow test in Inngest dev UI: detect → wait → fire → audit-row write end-to-end; replay to confirm idempotency (each `step.run` is named so retries are no-ops).
- Decide whether the 48h/96h/day-7 cadence should also send customer email nudges (PRD 04 only specifies "follow-up action queued"; v1 only writes the audit row — email content is a future task).
- Tune the timeout windows once we have real stall data.

## Next eligible

Per dependency check (v1 only):
- Task #32 — deps satisfied. **Eligible — lowest id.**
- Task #52 — eligible.
- Task #55 (entries schema) — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.
- Task #72 (admin dashboard scaffold) — eligible.

Lowest-id eligible is **task #32**.

## Notes

- Wave 12 (Lifecycle email + Inngest) — stalled cadence landed.
- Loop will continue with #32 next iteration.
