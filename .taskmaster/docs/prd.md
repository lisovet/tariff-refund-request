# PRD: IEEPA Refund Audit, Entry Recovery & CAPE Filing-Prep Platform

**Author:** Founding team
**Date:** 2026-04-21
**Status:** Approved
**Version:** 1.0
**Taskmaster Optimized:** Yes

> Master PRD that consolidates twelve per-context PRDs (`docs/prds/`) into a single taskmaster-ingestible document. The detailed source PRDs remain authoritative; this document is the planning surface for backlog generation.
>
> Companions: `docs/VISION.md` (platform vision), `docs/DESIGN-LANGUAGE.md` (visual contract), `docs/architecture-decisions.md` (15 ADRs).

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Goals & Success Metrics
4. User Stories
5. Functional Requirements
6. Non-Functional Requirements
7. Technical Considerations
8. Implementation Roadmap
9. Out of Scope
10. Open Questions & Risks
11. Validation Checkpoints
12. Appendix: Task Breakdown Hints

---

## Executive Summary

U.S. importers who paid IEEPA tariffs are entitled to refunds, but most cannot file because their entry data is fragmented across brokers, carriers, and ACE accounts they barely use. We are building the fastest, most trustworthy way for an importer to go from *"I think I paid these tariffs"* to *"I have a validated, submission-ready refund package."* The funnel monetizes the operational reality in stages — free eligibility screener → paid entry recovery ($99–499) → CAPE filing prep ($199–999) → concierge support ($999+ + 8–12% success fee). Submission readiness — not abstract refund analysis — is the paid product.

---

## Problem Statement

### Current Situation

Importers know they may have overpaid IEEPA tariffs but face a stack of operational obstacles before they can file:

1. They do not know whether they qualify.
2. They do not have a clean entry-number list.
3. Their records are fragmented across brokers (Flexport, Livingston), carriers (DHL, FedEx, UPS), and ACE portal exports they have never run.
4. They do not understand ACE/ACH prerequisites.
5. They cannot reliably prepare a CBP-compliant CAPE declaration file alone.

Existing customs platforms target large enterprise trade teams. There is no productized service that meets SMB and lower-mid-market importers where they actually are.

### User Impact

- **Who is affected**: Ecommerce brands and SMB importers (1–1000 entries/year) who used third-party brokers, express carriers, or self-filed via ACE.
- **How they are affected**: Real money sitting with the federal government that they cannot recover without a disproportionate operational lift.
- **Severity**: High — IEEPA refund window is event-driven and time-bounded.

### Business Impact

- **Cost of problem**: Tens of thousands of dollars per importer left unclaimed.
- **Opportunity cost**: A repeatable refund-recovery playbook is the foundation for adjacent recovery products and partner distribution.
- **Strategic importance**: Establishes operational credibility (human-reviewed artifacts, document ground-truth dataset) that compounds.

### Why Solve This Now?

The IEEPA refund window is open and time-bounded. Current customs SaaS offerings are mismatched to SMB reality. A focused, service-heavy productization wins this window.

---

## Goals & Success Metrics

### Goal 1: Qualified leads convert to first paid step

- **Description**: A material portion of completed screeners purchase Recovery Kit or Service.
- **Metric**: `screener_completed → paid_recovery` conversion %.
- **Baseline**: 0 (greenfield).
- **Target (90 days)**: ≥ 12% (subject to revision once early data lands).
- **Measurement**: Internal funnel analytics + Stripe events.

### Goal 2: Recovery customers convert to CAPE Prep

- **Description**: Cleaning the entries should make Prep the obvious next step.
- **Metric**: `entry_list_ready → cape_prep_purchased` conversion %.
- **Baseline**: 0.
- **Target (90 days)**: ≥ 55%.
- **Measurement**: Internal funnel analytics.

### Goal 3: Operational repeatability

- **Description**: Time-per-case must shrink as the playbook stabilizes.
- **Metric**: Median analyst hours per case, by stage.
- **Baseline**: TBD (week 4).
- **Target (90 days)**: 30% reduction from week-4 baseline.
- **Measurement**: Time-tracking on case workspace.

### Goal 4: Trust signal — first-pass QA

- **Description**: Validators should pass batches on first review.
- **Metric**: First-pass QA success rate.
- **Baseline**: TBD.
- **Target (90 days)**: ≥ 80%.
- **Measurement**: QA workflow telemetry.

### Goal 5: Refund realization

- **Description**: Filed cases must result in refunds at a credible rate.
- **Metric**: `filed → paid` rate within 180 days.
- **Baseline**: TBD.
- **Target (12 months)**: ≥ 70%.
- **Measurement**: Customer-confirmed and audit-log-verified.

---

## User Stories

### Story 1: Importer completes the eligibility screener

**As a** founder of a $5M ecommerce brand,
**I want to** quickly find out whether I'm owed an IEEPA refund,
**So that I can** decide whether to spend any time on this.

**Acceptance Criteria:**
- [ ] One question per screen; branching invisible to user.
- [ ] Result page renders refund estimate with confidence label.
- [ ] Recovery path (broker / carrier / ACE / mixed) is determined and surfaced.
- [ ] Disqualified state is respectful and offers opt-in for future updates.
- [ ] Email capture happens at end, framed as "where to send your results."
- [ ] Results page renders within 1.2s LCP and is screenshot-worthy.

**Dependencies**: None.

### Story 2: Customer purchases Entry Recovery Kit (broker variant)

**As a** customer who used Flexport,
**I want to** get a personalized outreach kit and upload portal,
**So that I can** get my entry summaries from my broker without writing the email myself.

**Acceptance Criteria:**
- [ ] Stripe Checkout completes; case transitions to `awaiting_docs`.
- [ ] Workspace renders with broker-specific outreach template pre-filled with company name.
- [ ] Document checklist surfaces accepted document types.
- [ ] Upload portal accepts PDF, XLSX, CSV, EML.
- [ ] Status banner anchors top of page.
- [ ] If 96 hours pass with no upload, follow-up email is queued via Inngest.

**Dependencies**: Story 1; Stripe wired.

### Story 3: Analyst extracts and validates entries

**As an** analyst working a paid Recovery Service case,
**I want to** view uploaded documents side-by-side with an entry-extraction form,
**So that I can** quickly extract entries with provenance and high confidence.

**Acceptance Criteria:**
- [ ] Three-pane workspace (queue / case / inspector + viewer).
- [ ] Drag-region copy from PDF to form field.
- [ ] Each saved entry carries `sourceRecordId`; audit log records actor.
- [ ] Duplicate detection surfaces side-by-side merge.
- [ ] Keyboard shortcuts available (`j/k/v/e/s`).

**Dependencies**: Story 2; doc viewer component; audit log infrastructure.

### Story 4: Customer purchases CAPE Filing Prep

**As a** customer with a validated entry list,
**I want to** get a CBP-compliant CSV plus a Readiness Report,
**So that I can** submit (or have my broker submit) my refund claim with confidence.

**Acceptance Criteria:**
- [ ] Validator runs on entry list; produces blocking / warning / info issues.
- [ ] Blocking issues prevent CSV download.
- [ ] Validator analyst signs off; sign-off recorded in audit log.
- [ ] Customer downloads CSV (CBP-compliant) and Readiness Report PDF.
- [ ] PDF includes hero metric, entry table, prerequisites checklist, signed analyst footer, footnotes.

**Dependencies**: Stories 2–3; CAPE schema + validator; PDF rendering.

### Story 5: Customer upgrades to Concierge

**As a** customer overwhelmed by submission logistics,
**I want to** hand off filing coordination to a human,
**So that I can** get the refund without managing it myself.

**Acceptance Criteria:**
- [ ] Concierge purchase requires e-signed engagement letter before payment captured.
- [ ] Case transitions to `concierge_active`.
- [ ] Coordinator is assigned; SLA timer starts.
- [ ] Customer sees status updates via lifecycle email + status banner.

**Dependencies**: Story 4; engagement letter templates; e-sign flow.

### Story 6: Coordinator triages the queue

**As a** coordinator at the start of my shift,
**I want to** see all queues with SLA risk,
**So that I can** prioritize my attention.

**Acceptance Criteria:**
- [ ] Queue list with state, SLA timer (color-coded), owner.
- [ ] Saved views (e.g., "At-Risk SLAs", "My Open Recovery").
- [ ] Keyboard navigation works.
- [ ] Claiming a case is single-keystroke.

**Dependencies**: Case state machine; auth roles.

### Story 7: Validator signs off on a Readiness Report

**As a** validator,
**I want to** complete the QA checklist and sign off,
**So that I can** release artifacts to the customer with confidence.

**Acceptance Criteria:**
- [ ] QA checklist enforces all required items; cannot sign off if any missing.
- [ ] Sign-off records validator name + timestamp + note.
- [ ] CSV + PDF artifacts generated post-sign-off.
- [ ] Customer is emailed; status banner updates.

**Dependencies**: Story 4; QA checklist logic.

### Story 8: Lifecycle nurture for stalled customer

**As a** customer who paid for Recovery 96 hours ago and hasn't uploaded,
**I want to** receive a helpful follow-up,
**So that I can** complete the workflow without falling through the cracks.

**Acceptance Criteria:**
- [ ] Inngest cadence fires at 48h / 96h / day-7 with appropriate templates.
- [ ] Each email is real-text, restrained, and offers a next action.
- [ ] Case transitions to `stalled` if no action by day-7.

**Dependencies**: Inngest workflows; Resend templates; case state machine.

---

## Functional Requirements

### Must Have (P0) — Critical for Launch (Phase 0, weeks 1–4)

#### REQ-001: Marketing site — homepage, /how-it-works, /pricing, /trust
Editorial-utilitarian design language strictly applied. GT Sectra display, Söhne body, Berkeley Mono numbers, ink-on-paper, single accent. Lighthouse ≥ 95 on all pages. SEO-indexed; analytics anonymous-friendly.

#### REQ-002: Branching eligibility screener
10-question branching screener; one question per screen; results dossier with refund estimate, confidence, recovery path, prerequisites, recommended next step. Resumable via email magic link within 7 days.

#### REQ-003: Auth via Clerk (customer + staff orgs)
Customer accounts via email + Google OAuth. Staff org with roles `coordinator`, `analyst`, `validator`, `admin`. Role enforcement inside contexts, not only middleware.

#### REQ-004: Case state machine (XState)
16-state machine encoded in `src/contexts/ops/case-machine.ts`. All state changes go through the machine. Audit log on every transition. Model-based tests.

#### REQ-005: Stripe Checkout for stage products
One-time checkout for Recovery Kit, Recovery Service, CAPE Prep Standard, CAPE Prep Premium, Concierge Base. Webhooks idempotent. Pricing ladder lives in code, syncs to Stripe at deploy time.

#### REQ-006: Recovery workspace (customer + ops view)
Path-aware (broker / carrier / ACE / mixed). Outreach kit pre-filled. Document checklist. Direct-to-R2 upload via 15-minute pre-signed URLs (TLS 1.3, server-side encryption AES-256). Three-pane ops view with side-by-side PDF + extraction form.

#### REQ-007: Document storage (R2)
S3-compatible. Versioning enabled. Per-case key scoping. No mocks in test — MinIO container.

#### REQ-008: Entry normalization & dedupe
`src/contexts/entries/normalize.ts` — canonicalize entry numbers, exact-match dedupe, fuzzy-match flag, IEEPA window tagging, phase segmentation, source-confidence tracking. Every entry carries provenance (`sourceRecordId`).

#### REQ-009: CAPE schema + validator + CSV builder
`src/contexts/cape/` — Zod schema, validator producing `ReadinessReport` with severity-leveled issues (blocking / warning / info), CSV builder for CBP-compliant output, immutable artifacts.

#### REQ-010: Readiness Report PDF
React PDF in `src/contexts/cape/report-pdf/`. Honors design language (GT Sectra masthead, Berkeley Mono numbers, hairline rules, real footnotes, signed analyst footer).

#### REQ-011: Ops queues, SLA, QA checklist
Queue list with SLA timer color-coding. Saved views. Keyboard-first. QA checklist gate prevents `submission_ready` without all items satisfied.

#### REQ-012: Lifecycle email (9-step) via Inngest + Resend
Templates as React Email components. Cadences: screener completed, 24h nudge, 72h nudge, recovery purchased, 96h stalled, entry list ready, prep ready, concierge upsell, day-14 re-engagement.

#### REQ-013: Audit log (Postgres + Axiom)
Append-only `audit_log` table; every state transition + sensitive admin action recorded. Mirrored to Axiom for sub-second-query investigation by ops staff.

#### REQ-014: Trust posture pages and disclosures
`/trust`, `/trust/sub-processors`, `/trust/security`, `/trust/legal-requests`. Canonical trust promise on homepage, Concierge engagement letter, Readiness Report. "Not legal advice" footnote on every page.

#### REQ-015: Engagement letter for Concierge (e-sign)
Versioned templates in `src/contexts/billing/agreements/`. E-signature required before Stripe captures payment. Signed copy linked in audit log.

### Should Have (P1) — Phase 1 (months 2–3)

#### REQ-016: Side-by-side document viewer with drag-region copy
Adds the "drag a region of PDF, value flows to focused form field" interaction.

#### REQ-017: Outreach template library + personalization tokens
Coordinator-curated templates with tokenized fields. Versioned.

#### REQ-018: Stalled-case cadences and admin-issued credit/refund UI
Inngest cadences plus admin tooling that respects the audit log.

#### REQ-019: Internal notes + @-mentions in cases
Case-scoped notes log with markdown + mentions notifying staff.

#### REQ-020: Partner referral attribution + dashboard (Tier 1)
Referral query parameter capture, partner dashboard, revenue-share calculation.

#### REQ-021: Mailbox forward integration (read-only)
Per-case email forwarding inbox; attachments parsed into RecoverySources.

#### REQ-022: Analytics + funnel dashboards (internal)
Funnel conversion, ARPU, time-per-case, QA pass rate; private to staff.

### Nice to Have (P2) — Phase 2+ (months 4–12)

#### REQ-023: OCR + LLM-assisted entry extraction
Per PRD 08. Per-case budget; eval suite gates prompts.

#### REQ-024: AI-drafted Readiness Report notes (validator-finalized)
Per PRD 08.

#### REQ-025: Multi-tenant org model + co-branded screener embeds (Phase 3)
Per PRD 09. Foundation laid in v1 (orgId on every customer record).

#### REQ-026: White-label for first design partner
Per PRD 09 Tier 3.

#### REQ-027: Multi-entity case linking (parent IOR + children)
Per PRD 09.

---

## Non-Functional Requirements

### Performance

- Marketing pages: LCP < 1.2s, no script > 100kb served on first paint.
- App pages: TTI < 2.5s on 4G.
- API endpoints: p95 < 250ms for read paths.
- Validator: 1,000-entry batch validates in < 5 seconds.
- PDF generation: < 8 seconds for typical Readiness Report.

### Security

- Auth: Clerk-managed, MFA required for staff.
- Authorization enforced inside contexts (not only at the route boundary).
- All transit TLS 1.3; all storage encrypted at rest.
- Document URLs pre-signed with 15-minute expiry.
- Audit log append-only; no DELETE permission for any role.
- Quarterly access review.
- Annual third-party penetration test (post-revenue threshold).

### Compliance

- GDPR / CCPA: access, correction, deletion supported within 30 days.
- Document retention: 7 years (CBP-aligned); audit log: 7 years.
- Sub-processor list public; updated within 14 days of changes.
- DPA available on request.
- SOC 2 Type I targeted within 12 months.

### Reliability

- Uptime SLA: 99.9% monthly.
- RTO < 4 hours (quarterly restore drill).
- RPO < 15 minutes (Postgres PITR via Neon).
- Inngest retries with exponential backoff on every workflow step.
- Stripe webhooks idempotent (dedupe by event id).

### Accessibility

- WCAG 2.1 AA on all customer-facing surfaces.
- Keyboard-only navigation supported.
- Status colors never the only signal (paired with text + glyph).
- Screen-reader-tested screener and pricing page.

### Compatibility

- Desktop: latest 2 versions of Chrome, Firefox, Safari, Edge.
- Mobile: iOS 15+ Safari, Android 10+ Chrome.
- Marketing site fully usable on 3G.

### Aesthetic compliance (NFR — design)

- Every screen passes the `docs/DESIGN-LANGUAGE.md` gate before merge.
- No system fonts; no default Tailwind color usage; no default shadcn button styling.
- One accent element max above the fold on marketing.
- No motion springs; no purple gradients; no Inter.

---

## Technical Considerations

### Architecture

Modular monolith (ADR 001). Bounded contexts under `src/contexts/`:

```
src/contexts/{screener, recovery, entries, cape, ops, billing}
src/shared/{domain, infra}
src/app/{(marketing), (app), (ops), api}
```

Cross-context calls via public surfaces only (lint-enforced).

### Stack

- Next.js 15 App Router + TypeScript strict (ADR 002)
- Postgres (Neon) + Drizzle ORM (ADR 003)
- Clerk auth (ADR 004)
- Stripe payments (ADR 005)
- Cloudflare R2 storage (ADR 006)
- Inngest workflows (ADR 007)
- XState case machine (ADR 008)
- Zod validation (ADR 009)
- shadcn/ui + Tailwind + Radix (ADR 010)
- Vitest + Playwright + Testing Library + @xstate/test (ADR 011)
- Resend + React Email (ADR 012)
- Sentry + Axiom (ADR 013)
- Custom CAPE schema + validator (ADR 014)
- Routing logic as domain code (ADR 015)

### Data model (high-level)

```
Customer ─< Case ─< RecoverySource ─ EntrySourceRecord
                ├< EntryRecord ─< Batch
                ├< ReadinessReport
                ├< Payment (Stripe)
                ├< NoteEntry
                └< AuditLogRow (append-only)
StaffUser ── CaseAssignment
PartnerOrg ─< CaseAttribution (Phase 3)
```

### Migration & deployment

- Vercel deploys per branch with Neon DB branches per PR.
- Drizzle migrations versioned in `drizzle/`.
- Stripe catalog synced from `pricing.ts` at deploy.
- Inngest functions deployed via Vercel adapter.

### Testing strategy

- Unit/integration via Vitest with isolated per-worker Postgres schemas (`pg_temp_<workerId>`) for parallel test execution.
- Component tests via Testing Library.
- E2E via Playwright with role-scoped fixtures.
- Case-machine via @xstate/test (model-based).
- CAPE validator via golden-file fixtures in `tests/fixtures/cape/`.
- Stripe via stripe-mock (unit) + real test mode (integration).
- Storage via MinIO container.

---

## Implementation Roadmap

### Phase 0 — MVP (Weeks 1–4)

Goal: ship the eligibility screener + entry recovery + CAPE prep end-to-end. Land 10 paid recovery cases and 5 prep deliveries.

Validation Checkpoint: a real customer can sign up, complete the screener, buy Recovery Kit, upload docs, receive a validated entry list, buy Prep, receive the Readiness Report — without staff acting outside the console.

### Phase 1 — Ops scaling (Months 2–3)

Goal: bend the manual cost curve. Repeatable case ops; first partner pilot.

Validation Checkpoint: median time-per-case shrinks; first partner referrals convert.

### Phase 2 — AI assist (Months 4–6)

Goal: OCR + LLM augment the analyst, not replace them.

Validation Checkpoint: median analyst time per case drops ≥ 40%; first-pass QA improves; per-case AI cost in budget.

### Phase 3 — Partner & enterprise expansion (Months 7–12)

Goal: partner motion produces ≥ 30% of new revenue; first white-label partner live; enterprise foundation in place.

Validation Checkpoint: partner pipeline live; one white-label live; one enterprise pilot signed.

---

## Out of Scope (v1)

- Direct CBP submission.
- Generic customs/trade SaaS framing.
- Enterprise multi-entity dashboards.
- Fully-automated document parsing (OCR is Phase 2).
- In-product legal advice.
- Multi-language UI (English-only at v1).
- Mobile-first ops console.
- Cryptocurrency payments.
- Affiliate marketplace.

---

## Open Questions & Risks

### Open Questions

1. Free screener vs low-cost screener — **Owner**: founder; **Deadline**: end of Phase 0 instrumentation.
2. Recovery Kit vs Service emphasis — **Owner**: ops; **Deadline**: month 2.
3. ACE setup as add-on or included in Concierge — **Owner**: founder; **Deadline**: month 1.
4. Ecommerce-only at launch vs broader SMB — **Owner**: marketing; **Deadline**: continuous.
5. OCR rollout timing — **Owner**: founding eng; **Deadline**: month 4.
6. Partner motion start date — **Owner**: founder; **Deadline**: month 2.

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Low screener-to-paid conversion | Medium | High | Iterate on results dossier copy + price ladder; instrument early |
| Manual ops cost outpaces revenue | Medium | High | Aggressive playbook + Phase 2 AI assist |
| First-pass QA failures erode trust | Low | High | Strict validator gate; golden-file CAPE tests |
| Stripe success-fee enforceability | Medium | Medium | Strong engagement letter; small early cohort to validate |
| Customer document set incomplete or unreadable for prep | High | Medium | Recovery Service tier handles incomplete cases; risk-reversal credits within 14 days |
| CBP format change mid-window | Low | High | CAPE schema versioned; quarterly format-watch |
| Vendor outage (Clerk/Stripe/R2/Inngest) | Low | High | Adapter layer per vendor; documented runbooks |

---

## Validation Checkpoints

### Checkpoint 1 (end of MVP foundation, week 1)

- [ ] Repo scaffolded; CI green; staging deployed.
- [ ] Auth (Clerk) + DB (Drizzle migrations) wired.
- [ ] Storage (R2) + workflows (Inngest) wired.
- [ ] Marketing homepage live (with design-language compliance review passed).

### Checkpoint 2 (end of MVP middle, week 2)

- [ ] Screener complete + results page live.
- [ ] Stripe Checkout flows for Recovery + Prep working in test mode.
- [ ] Case state machine in production with audit log.

### Checkpoint 3 (end of MVP back-half, week 3)

- [ ] Recovery workspace (customer + ops) live.
- [ ] Entry ingestion + dedupe working.
- [ ] CAPE validator with golden-file tests passing.

### Checkpoint 4 (MVP launch, week 4)

- [ ] Readiness Report PDF generation passing design review.
- [ ] Lifecycle email sequence wired and tested end-to-end.
- [ ] Trust pages live; engagement letter e-sign working.
- [ ] First real paying customer journey completes successfully.

### Checkpoint 5 (Phase 1, month 3)

- [ ] Time-per-case shrinking week over week.
- [ ] First partner referral converted.
- [ ] Internal funnel dashboards in use.

---

## Appendix: Task Breakdown Hints

The MVP backlog (`.taskmaster/tasks.json`) is organized into the following epics. Each epic decomposes into 4–8 atomic tasks (~2–8h each), with USER-TEST checkpoints inserted every 5 tasks.

| Epic | Source PRDs | Tasks | Phase |
| --- | --- | --- | --- |
| E1. Foundation (repo, CI, infra) | ADRs 002–013 | 6 | 0 |
| E2. Auth + roles | ADR 004 | 4 | 0 |
| E3. Marketing site | PRD 05 | 6 | 0 |
| E4. Eligibility screener | PRD 01 | 6 | 0 |
| E5. Stripe + pricing ladder | PRD 06 | 5 | 0 |
| E6. Case state machine + audit log | PRD 04 | 5 | 0 |
| E7. Document storage + uploads | PRD 02, ADR 006 | 4 | 0 |
| E8. Entry recovery workspace | PRD 02 | 6 | 0 |
| E9. Entry ingestion + normalization | PRD 07 | 5 | 0 |
| E10. CAPE schema + validator + CSV | PRD 03, ADR 014 | 6 | 0 |
| E11. Readiness Report PDF | PRD 03 | 4 | 0 |
| E12. Lifecycle email + Inngest | PRD 05, ADR 007 | 5 | 0 |
| E13. Trust posture + engagement letter | PRD 10 | 5 | 0 |
| E14. Ops console (queues, SLA, QA) | PRD 04 | 6 | 0 |
| E15. Phase 1 — ops scaling | PRDs 02, 04, 05 | (deferred) | 1 |
| E16. Phase 2 — AI assist | PRD 08 | (deferred) | 2 |
| E17. Phase 3 — partner & enterprise | PRD 09 | (deferred) | 3 |

Phase 0 totals approximately **77 tasks** plus **15 USER-TEST checkpoints** (one per ~5 tasks).
