# ADR 008 — XState for the case state machine

**Status:** Accepted

## Context

The Case lifecycle has 16 states (New Lead → Qualified → Awaiting Purchase → Awaiting Docs → Entry Recovery In Progress → Entry List Ready → CAPE Prep In Progress → Batch QA → Submission Ready → Concierge Active → Filed → Pending CBP → Deficient → Paid → Closed; plus Disqualified). Many transitions are guarded (e.g., "cannot enter Submission Ready without QA pass"). Encoding this as ad-hoc `if (case.state === ...)` checks scattered across the codebase is exactly the failure mode we want to avoid.

## Decision

**XState** for the case state machine.

- Single machine in `src/contexts/ops/case-machine.ts`.
- Every state transition is named and guarded.
- The DB column `cases.state` is a denormalization of the machine's current state — written only via the machine.
- Side effects (notifications, queue jobs) declared as XState actions, not invoked ad hoc.

## Consequences

- ✅ Impossible to set a case to an invalid state.
- ✅ Visualizable diagram for product/ops conversations (XState inspector).
- ✅ Model-based testing (`@xstate/test`) gives near-complete transition coverage for free.
- ⚠️ Learning curve — but the alternative is a hidden state machine, which is worse.
- ⚠️ Must avoid leaking XState types into the public API of the `ops` context — wrap them.

## Test-impact

- Every transition must have a passing model-based test before merge.
- Tests assert both the resulting state *and* the side effects (queued jobs, emails).
