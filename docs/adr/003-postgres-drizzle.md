# ADR 003 — Postgres + Drizzle ORM

**Status:** Accepted

## Context

The data model is relational and hierarchical: Customer → Case → (Entries, Documents, Batches, ReadinessReports, Payments). We need transactional integrity around case state transitions, ad-hoc SQL for the entry-validation reports, and a schema we can evolve quickly. We also want generated TypeScript types so the domain layer stays in sync with the schema.

## Decision

- **Postgres** as the system of record. Railway Postgres hosts both the app and database in a single project; the Postgres branch can be swapped to AWS RDS or Supabase via a one-line `DATABASE_URL` change.
- **Drizzle ORM** for schema definition, migrations, and queries.

Why Drizzle over Prisma:
- Closer to SQL — important for the entry/CAPE prep work where we need handwritten queries for validation, dedupe, and batch grouping.
- Lighter runtime (no separate engine binary).
- Schema-first TypeScript inference matches our Zod-everywhere posture (ADR 009).

## Consequences

- ✅ One source of schema truth (`src/shared/infra/db/schema.ts`).
- ✅ Migrations are versioned SQL files in `drizzle/`, reviewable in PR.
- ✅ Railway's per-environment branches (dev / staging / prod) share the same connection-string shape; preview deploys spin up a fresh DB.
- ⚠️ Drizzle's ecosystem is smaller than Prisma's — accept some rough edges.

## Test-impact

- **No DB mocking, ever.** Integration tests use a real Postgres (Railway branch in CI, or testcontainers locally).
- Each test worker gets its own schema (`pg_temp_<workerId>`) for parallel isolation.
- Test fixtures use the same Drizzle schema — no parallel ORM definitions.
