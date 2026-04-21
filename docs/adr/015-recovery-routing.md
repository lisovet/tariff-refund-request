# ADR 015 — Recovery routing (broker / carrier / ACE) as domain code

**Status:** Accepted

## Context

A central insight from the PRD revision: routing the user down the right entry-recovery path (broker, carrier, or ACE self-export) is **product logic**, not UI navigation. The right path drives the outreach kit content, the document templates accepted, the ops queue assignment, and the SLA. Encoding this as `if (path === 'broker')` checks scattered across UI and routes guarantees drift.

## Decision

`src/contexts/recovery/routing.ts` exposes:

```ts
export type RecoveryPath = 'broker' | 'carrier' | 'ace-self-export'
export const determineRecoveryPath: (answers: ScreenerAnswers) => RecoveryPath
export const recoveryPlanFor: (path: RecoveryPath) => RecoveryPlan
```

A `RecoveryPlan` is a typed object describing: the outreach kit template, the accepted document types, the ops queue, the SLA, the prerequisite checks. UI and ops console **read from** the plan; they do not branch on the path.

## Consequences

- ✅ Adding a new path (e.g., freight forwarder) is a single-file change.
- ✅ Tests cover the routing function directly with screener-answer fixtures.
- ⚠️ The temptation to branch in UI must be resisted — covered by lint rule `no-recovery-path-conditionals` (custom).

## Test-impact

- Routing function: pure, fully covered by table-driven tests.
- Plan content: snapshot tests so plan changes are visible in PR review.
