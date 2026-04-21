# ADR 011 — Vitest + Playwright for testing

**Status:** Accepted

## Context

We need fast unit tests for context logic and end-to-end tests that exercise the full stack including auth, payments, and uploads. Jest is heavier and slower than alternatives; Cypress is e2e-only.

## Decision

- **Vitest** for unit, integration, and component tests. Native TS, ESM, and Vite-fast.
- **Playwright** for end-to-end tests against a deployed preview environment.
- **Testing Library** for component DOM queries.
- **@xstate/test** for case-machine model coverage (per ADR 008).
- **Stripe CLI + stripe-mock** per ADR 005.
- **MinIO** for storage tests per ADR 006.
- **Inngest dev server** for workflow tests per ADR 007.

## Consequences

- ✅ Unified test runner for everything except e2e.
- ✅ Vitest's parallel mode + per-worker DB schemas → fast CI.
- ⚠️ Playwright in CI is slow; gate it to changes that touch UI or critical user flows.

## Test-impact

- All test commands live in `package.json` scripts: `test`, `test:integration`, `test:e2e`, `test:watch`.
- Coverage gate >80% on context code; UI components excluded from coverage threshold.
