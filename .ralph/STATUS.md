# Ralph Loop Status

**Updated**: 2026-04-21T10:48:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 45 → 46)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 45 |
| in-progress | 0 |
| pending | 41 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 71 files, 533 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 21 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#49 — Recovery routing module per ADR 015**

- `src/contexts/recovery/routing.ts` — pure module exposing `determineRecoveryPath(answers)` and `recoveryPlanFor(path)`.
- `RecoveryPlan` carries `outreachTemplate` (subject + body with `{{placeholders}}`), `acceptedDocs`, `opsQueue`, `sla` (firstTouch + completion hours), and `prerequisiteChecks`. Four plans (broker, carrier, ace-self-export, mixed), all frozen via `toMatchSnapshot` so any plan change is visible in PR review.
- UI + ops console MUST read from the plan, never branch on `path` per ADR 015's `no-recovery-path-conditionals` rule. Custom lint enforcement deferred to when the workspace lands (#51+).
- `qualification.ts` refactored: removed inline `mapRecoveryPath`, now calls `determineRecoveryPath` from `@contexts/recovery` via the UI-safe public surface (no ADR-001 violation; the import is kept type-clean by re-exporting the function from `index.ts`).
- `SCHEMA_TO_RECOVERY_PATH` bridges the snake_case schema enum (`ace_self_export`) to the ADR-015 kebab-case (`ace-self-export`).
- 26 new tests (table-driven path determination + per-path queue/docs/SLA/template assertions + snapshot freeze + non-empty invariant). Existing 16 screener qualification tests still green after the refactor.

## Human-verification still owes

- Sign off on the four plan snapshots — these are the customer-facing outreach templates and the ops queue assignments. Wording / SLA changes are deliberate ladder shifts, not silent drift.
- Wire the custom `no-recovery-path-conditionals` ESLint rule once the recovery workspace lands in #51 — the rule should fail any UI conditional like `if (path === 'broker') ...` outside `routing.ts`.

## Next eligible

Per dependency check (v1 only):
- Task #50 — deps satisfied. **Eligible — lowest id.**
- Task #52 — eligible.
- Task #55 (entries schema) — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.
- Task #72 (admin dashboard scaffold) — eligible.

Lowest-id eligible is **task #50**.

## Notes

- Wave 8 (Recovery context) — routing module landed; outreach templates frozen.
- Loop will continue with #50 next iteration.
