# Ralph Loop Status

**Updated**: 2026-04-21T06:21:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 9 → 10)

## Counts

| Status | Count |
| --- | --- |
| completed | 9 |
| in-progress | 0 |
| pending | 77 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 15 files, 93 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — middleware 85.1 kB |
| `npm run qa` (combined) | green |

## Last completed task

**#9 — Configure Clerk staff org with roles**

- `STAFF_ROLES` enum (coordinator | analyst | validator | admin) + `staffRoleRank` + `hasAtLeastRole` + `isStaffRole` in `src/shared/infra/auth/roles.ts`.
- `can(actor, action)` permission helper in `src/shared/infra/auth/can.ts` — single chokepoint for authorization decisions across contexts and route handlers. Typed `Action` union covers public (screener), customer (case.read, document.upload, etc.), ops (queue.view, case.assign, case.transition, entry.extract), QA (qa.signoff, validator-gated per `.claude/rules/human-qa-required.md`), and admin (refund.issue, role.manage, audit.export).
- `src/middleware.ts` extended to gate `/ops/**` via `session.sessionClaims.org_role`. Authed-but-no-staff-role users bounce to `/app`. Unauthed continues to redirect to `/sign-in`.
- `tests/e2e/anonymous/ops-redirect.spec.ts` covers the unauthed branch (skips without Clerk env).
- 12 new tests (roles + can matrix) — RED-confirmed before implementation.

## Human-verification still owes

- Create the staff Clerk organization in the dashboard.
- Define the four roles in Clerk (coordinator, analyst, validator, admin).
- Enable MFA on the staff org.
- Run the live Playwright spec covering: analyst can access /ops, customer cannot, admin can manage roles.

## Next eligible

Task #10 — Build Actor resolver + context-layer authorization (depends on #9; eligible). Wires the actor + can() into a request-scoped resolver and enforces it in the context layer.

## Notes

- Wave 2 (auth + roles) is 2/4 done.
- Loop will continue with task #10 next iteration.
