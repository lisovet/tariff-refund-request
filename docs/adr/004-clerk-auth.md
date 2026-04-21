# ADR 004 — Clerk for authentication and roles

**Status:** Accepted

## Context

We need (1) customer auth with email + Google OAuth, (2) staff auth with role-based access for the ops console, and (3) row-level access controls so customers only see their own cases. Building this is exactly the kind of NIH trap to avoid.

## Decision

**Clerk** for auth + organization/role management.

- Customers: personal accounts.
- Staff: members of an internal Clerk organization with roles `analyst`, `validator`, `coordinator`, `admin`.
- Server-side: every route handler resolves the Clerk user → loads `Customer` or `StaffUser` → passes a typed actor object to the context layer.
- Authorization is enforced **inside contexts**, not in route handlers (so the same rules apply to background jobs and webhooks).

## Consequences

- ✅ No password storage, MFA, or session management on our side.
- ✅ Pre-built UI components for sign-in / org management.
- ⚠️ Clerk pricing scales per MAU — acceptable at our scale; revisit if we cross 50k MAU.
- ⚠️ Vendor lock-in. Mitigated by keeping `Actor` resolution behind a single adapter (`src/shared/infra/auth/`).

## Test-impact

- Use `@clerk/testing` to mint test JWTs. Never stub the verification path.
- E2E tests sign in via Clerk's testing mode at the start of each spec.
