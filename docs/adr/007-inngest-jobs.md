# ADR 007 — Inngest for durable workflows + reminders

**Status:** Accepted

## Context

Many workflows are inherently long-running: outreach reminder cadences (48h / 96h / day-7), document processing pipelines, lifecycle email sequences, and stalled-case escalations. Cron + an in-process queue would lose state on every deploy. We need durable, replayable, observable workflow execution.

## Decision

**Inngest** for durable workflows and scheduled jobs.

- Workflows live under `src/contexts/<context>/workflows/` and are co-located with the domain code they serve.
- Each workflow step is idempotent and the function name is the step's identity — replays are safe.
- Cron-style schedules (e.g., daily SLA breach scan) defined alongside event-driven workflows.

Why Inngest over alternatives:
- Trigger.dev was the close runner-up; chose Inngest for the better step-function ergonomics and replay UX.
- BullMQ would require running our own Redis + worker dynos — ops overhead we want to defer.

## Consequences

- ✅ Workflows survive deploys; failures retry with backoff automatically.
- ✅ The Inngest dashboard doubles as a debugging tool for ops.
- ⚠️ Vendor lock-in. Mitigated by keeping workflow steps as plain TS functions called from a thin Inngest wrapper.
- ⚠️ Local dev requires the Inngest dev server — added to `npm run dev` script.

## Test-impact

- Use the Inngest dev server in tests; assert step outputs, do not mock the runtime.
- Workflow tests live next to the workflow file: `<workflow>.test.ts`.
