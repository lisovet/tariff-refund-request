# ADR 013 — Sentry + Axiom for observability

**Status:** Accepted

## Context

A high-trust, document-handling product with paid users requires visibility into errors, performance, and a structured audit log of every state transition and document operation. Compliance also expects an immutable audit trail.

## Decision

- **Sentry** for error tracking and performance monitoring (browser + server + Inngest).
- **Axiom** for structured logs and audit events. Cheaper than Datadog, fast queries.
- Audit log is double-written: `audit_log` table in Postgres (source of truth, transactional) + Axiom stream (queryability).

## Consequences

- ✅ Errors page the team via Sentry alerts.
- ✅ Postgres audit log can never be lost; Axiom gives ops fast investigation.
- ⚠️ Log volume cost — sample non-critical traces; never sample audit events.

## Test-impact

- Sentry init wrapped in a single module — tests assert audit-log writes on every state transition; Sentry itself is not exercised in tests.
