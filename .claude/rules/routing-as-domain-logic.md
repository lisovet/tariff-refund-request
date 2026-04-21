# Recovery routing (broker / carrier / ACE) is domain logic, not UI glue

Encoded in `src/contexts/recovery/routing.ts` per ADR 015. Driven by `determineRecoveryPath()` and `recoveryPlanFor()`. UI and ops console **read from** the plan; they do not branch on the path.

## Forbidden patterns

- `if (path === 'broker') ...` checks scattered across UI components or route handlers.
- New conditional branches that hardcode path-specific behavior outside the routing module.
- Duplicating the recovery-plan content in any other file.

## Required patterns

- All path-specific differences (outreach template, accepted document types, ops queue, SLA, prerequisite checks) live inside `RecoveryPlan`.
- UI components consume the `RecoveryPlan` and render fields from it.
- Adding a new path (e.g., freight forwarder) is a single-file change in `routing.ts`.

## Why this matters

When path branching leaks into UI and ops code, every subsequent change becomes a multi-file PR and the ops experience drifts between paths. Centralizing the strategy is what makes the recovery business operationally repeatable.

## How to apply

- Custom ESLint rule `no-recovery-path-conditionals` (to be added) flags path-string equality checks outside `routing.ts` and its tests.
- PR review: any path-aware UI must point to a `RecoveryPlan` field rather than a path-string check.
