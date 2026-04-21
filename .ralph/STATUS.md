# Ralph Loop Status

**Updated**: 2026-04-21T06:35:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 11 → 12)

## Counts

| Status | Count |
| --- | --- |
| completed | 11 |
| in-progress | 0 |
| pending | 75 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 20 files, 130 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green |
| `npm run db:generate` | green — first migration drizzle/0000_identity.sql |
| `npm run qa` (combined) | green |

## Last completed task

**#11 — Customer + StaffUser DB tables and sync**

- Drizzle schema (`customers` + `staff_users`) with `UNIQUE(clerk_user_id)` constraint backing webhook idempotency.
- Initial migration `drizzle/0000_identity.sql` generated.
- `IdentityRepo` contract + in-memory implementation (used by tests and dev fallback) + Drizzle implementation typed against `PostgresJsDatabase<Schema>`.
- `handleClerkEvent` dispatcher routes:
  - `user.created` / `user.updated` → `upsertCustomer`
  - `organizationMembership.created` / `.updated` → `upsertStaffUser` (rejects unrecognized roles defensively)
  - `organizationMembership.deleted` → `deactivateStaffUser` (preserves row for audit trail per `.ralph/PROMPT.md`)
  - Unknown event types are silent no-ops.
- Webhook route at `src/app/api/webhooks/clerk/route.ts`:
  - Requires svix-id / svix-timestamp / svix-signature headers.
  - Verifies via Svix `Webhook` when `CLERK_WEBHOOK_SECRET` is set.
  - Falls back to JSON parse only in non-production environments.
  - Logs success + captures errors via the observability adapters from task #5.
- `getIdentityRepo()` factory switches Drizzle ↔ in-memory by `DATABASE_URL`.
- 14 new tests (repo + sync) including REPLAY assertions proving idempotency.

## Wave 2 complete

Tasks #8–#11 all done. Identity stack is wired end-to-end: middleware gates, role enum + can() matrix, resolver + require* guards, customer/staff DB sync via Clerk webhook. Wave 3 (marketing surfaces + design system primitives) begins next iteration with task #12.

## Next eligible

Task #12 — Theme tokens + design system primitives (depends on #1; eligible).

## Human-verification still owes

- Provision Clerk webhook endpoint pointing at `/api/webhooks/clerk` in the dashboard.
- Set `CLERK_WEBHOOK_SECRET` in `.env.local`.
- Run live user-created flow and confirm a single `customers` row appears.

## Notes

- Loop will continue with task #12 next iteration.
