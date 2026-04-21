# ADR 012 — Resend for transactional + lifecycle email

**Status:** Accepted

## Context

We need (1) transactional email (receipts, doc-ready notifications), (2) lifecycle email (9-step nurture sequence: screener completed → results → recovery purchase → missing docs → ... → re-engage), (3) personalized broker/carrier outreach kits the user can copy-send.

## Decision

**Resend** for transactional + lifecycle, with React Email for templates.

- Templates live in `src/contexts/<context>/emails/` next to the workflow that triggers them.
- Lifecycle scheduling driven by Inngest (ADR 007), not Resend's broadcast features.
- Outreach-kit emails are *generated* (the user copy-pastes) — not sent on the user's behalf to avoid deliverability and authorization issues.

## Consequences

- ✅ React Email components are testable like regular React.
- ✅ Resend's deliverability is strong; DKIM/SPF setup is straightforward.
- ⚠️ Lifecycle orchestration is in Inngest, not Resend — single source of scheduling truth.
- ⚠️ Avoid sending high-volume marketing through the same domain as transactional.

## Test-impact

- Email templates have snapshot tests for HTML output.
- Workflow tests assert that the right email step ran, not the email content (covered by template tests).
