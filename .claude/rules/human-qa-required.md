# Human QA is required before any "submission ready" artifact ships

No automated path produces a customer-facing artifact labeled `submission_ready` without a `validator` role staff member having signed off.

## Forbidden patterns

- Workflows that auto-transition `batch_qa` → `submission_ready`.
- Bypass conditions like "if all blocking issues are zero, skip validator."
- AI-only sign-off, even at high confidence.
- Hidden / non-visible "auto-approve" code paths.

## Required patterns

- The QA checklist gate enforced server-side; missing items reject sign-off.
- Sign-off records the validator's name and timestamp; both appear on the customer-facing artifact.
- AI-drafted Readiness Report notes (Phase 2) are *drafts* finalized by a human validator.

## Why this matters

Human-reviewed submission readiness is the product's core trust promise and its most defensible feature. Removing the human is a strategic error, not just an operational one.

## How to apply

- When implementing or refactoring the case state machine, the `submission_ready` transition must require a `validator` actor.
- When implementing AI-assist features, surface drafts; never auto-finalize.
- Any "speed up validator" suggestion must preserve the gate, not bypass it.
