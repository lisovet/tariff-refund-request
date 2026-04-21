# ADR 009 — Zod as the single source of validation truth

**Status:** Accepted

## Context

We have three places that need to validate the same shapes: HTTP route handlers (form posts, JSON bodies), workflow event payloads (Inngest), and CSV parsing (CAPE upload, ACE export). Three sets of validators would diverge — exactly the bug class that breaks data pipelines.

## Decision

**Zod** as the single validation layer for all data crossing a boundary.

- One schema per domain shape (e.g., `EntrySchema`, `ScreenerAnswersSchema`).
- Drizzle table inferred → Zod schema derived via `drizzle-zod` for DB rows.
- Route handlers parse with Zod before calling the context layer.
- Inngest event payloads are Zod-validated inside the workflow function's first step.
- CSV row parsers convert raw strings → Zod-validated typed rows in one pass.

## Consequences

- ✅ One schema, three uses — no drift.
- ✅ Type inference (`z.infer<typeof Schema>`) gives us TS types for free.
- ✅ Error messages are uniform across boundaries.
- ⚠️ Zod's runtime cost is non-trivial on hot paths — profile before adopting on >10k rows/sec workloads (not relevant pre-PMF).

## Test-impact

- Schema tests live next to each schema: `<schema>.test.ts` covers happy path + 5 edge cases minimum.
- Fixture data is generated from the Zod schemas to guarantee shape parity.
