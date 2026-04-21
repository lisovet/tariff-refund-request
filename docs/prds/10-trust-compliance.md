# PRD 10 — Trust, Compliance & Disclosure

## Purpose

Trust is the product. This PRD codifies the disclosures, data-handling, and UX promises that protect customers and the company. It is binding on every screen, email, and artifact we ship.

## The trust promise (canonical)

> We help prepare your refund file. We do not guarantee CBP will approve it. We do not provide legal advice in this product. Every artifact you receive has been reviewed by a real person before it reaches you.

This sentence appears verbatim in three places: the homepage trust section, the Concierge engagement letter, and the Readiness Report PDF.

## In 30 seconds, every screen must convey

1. What stage the customer is in.
2. What they are paying for.
3. What output they will receive.
4. What is still their responsibility.
5. That the output is human-reviewed.

This is a UX constraint, not a marketing line. It drives layout, copy, and the persistent status banner.

## Required disclosures

| Disclosure | Where it appears |
| --- | --- |
| "Not legal advice." | Footer of every page; Readiness Report footnotes; engagement letters |
| "Not a customs broker (unless separately noted)." | /trust page; engagement letters |
| "We prepare files; you control submission." | /how-it-works; CAPE Prep page; Readiness Report |
| "Refund timing depends on CBP review." | Concierge page; pending-CBP screen |
| "Incomplete or inaccurate records may delay or block filing." | Recovery workspace; CAPE Prep workspace |
| "Estimates are based on the information you provided." | Screener results page |
| "Engagement subject to written agreement." | Concierge purchase flow |

All disclosures are real text — never images, never collapsed behind a "Read more" by default.

## Data handling

### What we collect

- Identity: name, work email, company.
- Documents: 7501s, broker spreadsheets, carrier invoices, ACE exports, etc.
- Derived data: entries, batches, readiness reports, audit log.
- Payment metadata via Stripe (no card data on our side).

### Storage

- Postgres (per ADR 003) for structured data.
- Cloudflare R2 (per ADR 006) for documents — versioned, immutable, encrypted at rest.
- All transit encrypted (TLS 1.3).

### Retention

| Class | Default retention | Notes |
| --- | --- | --- |
| Pre-results screener data | 30 days | Auto-deleted |
| Lead data (post-screener, no purchase) | 12 months | Then anonymized |
| Customer documents | 7 years | Aligns with CBP record retention |
| Audit log | 7 years | Append-only, never deleted |
| Anonymized aggregate metrics | Indefinite | No PII |

### Customer rights

- **Access**: customer can export all their data via the customer app.
- **Correction**: customer can request corrections; staff applies via case workspace.
- **Deletion**: on request, customer data is purged within 30 days (excluding records required to keep by law or for refund-fee accounting); audit log records the deletion event without retaining content.
- **Portability**: full JSON export available on request.

### Security posture

- Clerk-managed auth with MFA for staff.
- Role-based access enforced inside contexts (per ADR 004).
- Pre-signed upload URLs with 15-minute expiry.
- Document keys scoped to case; bucket-level isolation between environments.
- Sentry + Axiom for incident detection (per ADR 013).
- Quarterly access review; no shared accounts.
- Annual third-party penetration test (post-revenue threshold).

### Vendor / sub-processor list

Public list at `/trust/sub-processors`:

- Vercel (hosting), Neon (Postgres), Cloudflare R2 (storage), Clerk (auth), Stripe (payments), Resend (email), Inngest (workflows), Sentry (error tracking), Axiom (logs), AWS Textract / Google Document AI (Phase 2 OCR), Anthropic (Phase 2 LLM).

Updated within 14 days of any change.

## Compliance posture

- **GDPR** — applicable to EU residents who use the screener; standard data-processing terms; sub-processor list maintained; DPA available on request.
- **CCPA / CPRA** — California residents; deletion + access requests supported.
- **SOC 2 Type I** — targeted within 12 months once revenue justifies the audit cost.
- **Customs / CBP regulations** — we operate as a service preparing files; we do not act as a licensed customs broker. Customers needing brokered submission are routed through partner brokers (Phase 3) or self-submit.

## What we are not (explicitly)

- Not a law firm.
- Not a customs broker (unless explicitly noted).
- Not a financial-services provider.
- Not an automated CBP submission service.
- Not an insurance product.
- Not a replacement for licensed counsel on disputes.

This list lives at `/trust` and is restated in the engagement letter.

## Engagement letters

- **Recovery + Prep**: lightweight terms accepted at Stripe Checkout (referenced in receipt + email).
- **Concierge**: a real engagement letter, e-signed before work begins. Includes scope, deliverables, success-fee terms, dispute resolution.
- Templates versioned in `src/contexts/billing/agreements/`; every signed agreement records the version.

## Acceptance criteria

- **Given** any page on the marketing or app surface,
  **When** rendered,
  **Then** the "not legal advice" footnote is present and uses real text.
- **Given** a customer requests deletion,
  **When** the request is processed,
  **Then** all in-scope records are purged within 30 days and the audit log records the event.
- **Given** a Concierge purchase,
  **When** the customer reaches checkout,
  **Then** the engagement letter must be e-signed before payment can be captured.
- **Given** the Readiness Report PDF,
  **When** generated,
  **Then** it includes the canonical trust promise, the reviewing analyst's name, and real footnotes for caveats.
- **Given** a Stripe webhook indicates a refund,
  **When** processed,
  **Then** the audit log records the actor and reason.

## Edge case inventory

- Customer claims our prep work was wrong → defined dispute process with admin escalation; audit log surfaces every action.
- Subpoena / legal request for customer data → handled per published policy at `/trust/legal-requests`; customer notified unless prohibited.
- Sub-processor breach notification — we notify affected customers within 72 hours of confirmed exposure.
- Staff offboarding — Clerk org membership revoked + Stripe access revoked + Vercel team removed; runbook lives in `ops/runbooks/staff-offboarding.md`.
- Insider threat — least-privilege roles; sensitive admin actions require two-person sign-off (Phase 1).
- Document classification — no document is treated as "less sensitive"; everything is encrypted, audited, and retention-policy-bound.
- Cross-border data transfers — EU customer data may be processed in U.S. via standard contractual clauses; documented in DPA.
- Backup restoration — quarterly drill; restore time objective < 4 hours.
- Disclosure update — any change to the trust posture is announced via lifecycle email to all active customers.

## Design notes

- The `/trust` page is its own editorial surface — long-form, well-typeset, intentionally calm. It is the page we are most proud to point lawyers at.
- Disclosures use real footnote markup with superscript references to a footer block. Never a collapsed accordion.
- Status of "human-reviewed" on artifacts uses the validator's actual name and timestamp — restraint over generic "verified" badges.

## Out of scope (this PRD)

- Insurance / e&o specifics — handled by founder externally.
- Specific country-by-country international data residency — until international expansion warrants.
