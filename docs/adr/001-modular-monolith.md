# ADR 001 — Modular monolith with bounded contexts

**Status:** Accepted

## Context

The product spans several distinct domains (eligibility, recovery, entries, CAPE prep, ops, billing) but is operated by a small team with high coupling between contexts (a Case flows through all of them). Microservices would impose distributed-system overhead before we have any product-market fit signal, but a single mud-ball monolith would let domain rules leak across boundaries.

## Decision

Build a **modular monolith**. Bounded contexts live as sibling packages under `src/contexts/`:

```
src/
  contexts/
    screener/        # eligibility branching, qualification routing
    recovery/        # broker / carrier / ACE workflows, outreach kits
    entries/         # canonicalization, dedupe, provenance, batches
    cape/            # CSV schema, validator, readiness report
    ops/             # case state machine, queues, SLA tracking, QA
    billing/         # Stripe integration, pricing ladder, success fees
  shared/
    domain/          # Case, Entry, Batch — entities used across contexts
    infra/           # db client, storage client, email, queue (no business logic)
  app/               # Next.js app router (UI + route handlers only)
```

Cross-context calls must go through a context's **public surface** (`contexts/<name>/index.ts`). Lint rules forbid deep imports across context boundaries.

## Consequences

- ✅ One repo, one deploy, one database schema — fast iteration.
- ✅ Bounded contexts can be extracted to services later if scale demands it.
- ✅ Domain logic stays out of route handlers and React components.
- ⚠️ Discipline required to avoid cross-context coupling — enforce via ESLint `no-restricted-imports`.
- ⚠️ Shared domain entities (`Case`, `Entry`) live in `shared/domain` — if they grow >300 LOC of behavior, we have a context boundary problem.

## Test-impact

- Each context exposes its own test suite under `src/contexts/<name>/__tests__/`.
- Cross-context integration tests live in `tests/integration/` and exercise the public surfaces only.
