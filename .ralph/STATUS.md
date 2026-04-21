# Ralph Loop Status

**Updated**: 2026-04-21T09:54:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 36 → 37)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 36 |
| in-progress | 0 |
| pending | 50 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 60 files, 423 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 19 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#40 — XState case machine — states + transitions**

- `src/contexts/ops/case-machine.ts` encodes all 18 PRD-04 states + every documented transition.
- Pure: no I/O, no entry actions; the machine is run via `createActor()` inside the pure `nextState(current, event)` helper.
- XState symbols kept private to the file (ADR 008's warning honored). Public surface via `@contexts/ops`: `CaseState`, `CaseEvent`, `ActorRef`, `StaffRole`, `CASE_INITIAL_STATE`, `nextState`, `isValidTransition`.
- Hard rules enforced at the guard level:
  - `VALIDATOR_SIGNED_OFF → submission_ready` requires `actor.role === 'validator'` — admin / coordinator / analyst are all denied. No Readiness Report ever leaves QA without a real validator.
  - `CUSTOMER_FILED` never auto-fires; no implicit path into `filed`.
- Stall handling: `STALL_DETECTED` valid from any in-progress state; `STALL_RESUMED` carries a `resumeTo` payload pinned by `RESUMABLE_STATES` (no resuming into `closed` or `disqualified`).
- `disqualified` is terminal-with-opt-in via `REENGAGEMENT_OPT_IN → new_lead`.
- `closed` is fully terminal — every event is a no-op.
- 30 new tests including the full transition table via `it.each`, validator-role guard exercised for every other staff role, stall/resume guards, and a closed-is-terminal sweep.
- `xstate@^5` added as a dependency.

## Human-verification still owes

- Eyeball the machine in the XState inspector (visualizable diagram per ADR 008) once a runner exists.
- Decide whether `STALL_DETECTED` should also be valid from `submission_ready`, `concierge_active`, or `filed` (currently only in-progress workspace states + `pending_cbp`).

## Next eligible

Per dependency check (v1 only):
- Task #41 (case-machine runner — wires actions to side effects + audit_log) — deps `[40]` satisfied. **Eligible — lowest id.**
- Task #44 (documents + recovery_sources schema) — deps satisfied.
- Task #49 (recovery routing — broker vs DIY) — deps satisfied.
- Task #67 (CAPE prep workflow scaffold) — deps satisfied.
- Task #72 (admin dashboard scaffold) — deps satisfied.

Lowest-id eligible is **task #41** — case-machine runner.

## Notes

- Wave 7 (Case state machine + audit log) 2/several done.
- Loop will continue with task #41 next iteration.
