# Architecture Decisions

This is the index. Each ADR lives in `docs/adr/` and follows the format: **Status, Context, Decision, Consequences, Test-impact.**

| #   | Decision                                           | Status   | File |
| --- | -------------------------------------------------- | -------- | ---- |
| 001 | Modular-monolith with bounded contexts             | Accepted | [adr/001-modular-monolith.md](adr/001-modular-monolith.md) |
| 002 | Next.js + TypeScript strict for app + marketing + ops | Accepted | [adr/002-nextjs-typescript.md](adr/002-nextjs-typescript.md) |
| 003 | Postgres + Drizzle ORM                             | Accepted | [adr/003-postgres-drizzle.md](adr/003-postgres-drizzle.md) |
| 004 | Clerk for authentication and roles                 | Accepted | [adr/004-clerk-auth.md](adr/004-clerk-auth.md) |
| 005 | Stripe for stage-based pricing + success fees      | Accepted | [adr/005-stripe-payments.md](adr/005-stripe-payments.md) |
| 006 | Cloudflare R2 for document storage                 | Accepted | [adr/006-r2-storage.md](adr/006-r2-storage.md) |
| 007 | Inngest for durable workflows + reminders          | Accepted | [adr/007-inngest-jobs.md](adr/007-inngest-jobs.md) |
| 008 | XState for the case state machine                  | Accepted | [adr/008-xstate-case-machine.md](adr/008-xstate-case-machine.md) |
| 009 | Zod as the single source of validation truth       | Accepted | [adr/009-zod-validation.md](adr/009-zod-validation.md) |
| 010 | shadcn/ui + Tailwind + Radix for UI                | Accepted | [adr/010-shadcn-tailwind.md](adr/010-shadcn-tailwind.md) |
| 011 | Vitest + Playwright for testing                    | Accepted | [adr/011-vitest-playwright.md](adr/011-vitest-playwright.md) |
| 012 | Resend for transactional + lifecycle email         | Accepted | [adr/012-resend-email.md](adr/012-resend-email.md) |
| 013 | Sentry + Axiom for observability                   | Accepted | [adr/013-sentry-axiom-observability.md](adr/013-sentry-axiom-observability.md) |
| 014 | Custom CAPE schema + validator (no library exists) | Accepted | [adr/014-cape-schema.md](adr/014-cape-schema.md) |
| 015 | Routing logic (broker/carrier/ACE) as domain code  | Accepted | [adr/015-recovery-routing.md](adr/015-recovery-routing.md) |

## Library-first audit (custom code is justified only for these)

- **Domain entities** (Case, Entry, Batch, ReadinessReport) — unique to the IEEPA refund domain.
- **Case state machine** (XState config) — business invariant that no library encodes.
- **CAPE CSV schema + validator** — CBP-specific, no off-the-shelf library.
- **Entry canonicalization + dedupe + provenance** — domain-specific data hygiene.
- **Broker/carrier/ACE recovery routing** — strategy logic that *is* the product.
- **Stage-based pricing + success-fee accounting** — composes Stripe primitives, but the ladder logic is ours.

Everything else (auth, storage, email, queues, UI primitives, validation, testing) defers to a library.

## Test-affecting constraints (for `/test-driven-development`)

- **Drizzle + Postgres**: integration tests use a real Postgres (testcontainers or shared CI db with schema-per-worker). No DB mocking — see global rule on burned mock/prod divergence.
- **Inngest**: workflow tests use the Inngest dev server and assert step outputs; do not mock the runtime.
- **Stripe**: use `stripe-mock` for unit, real test-mode keys for integration (webhooks especially).
- **Clerk**: use `@clerk/testing` helpers; never stub the JWT verification path.
- **XState case machine**: covered by `@xstate/test` model-based tests — every transition must have a passing test before merge.
- **CAPE validator**: golden-file tests with real (anonymized) CBP-shaped fixtures committed to `tests/fixtures/cape/`.
