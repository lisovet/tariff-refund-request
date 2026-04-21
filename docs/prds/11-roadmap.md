# PRD 11 — 12-Month Roadmap

## Phase 0 — MVP (Weeks 1–4)

**Goal**: ship the eligibility screener + entry recovery + basic CAPE prep, end-to-end. Land 10 paid recovery cases and 5 prep deliveries.

Deliverables:
- Branching screener with results dossier (PRD 01).
- Marketing site v1 (homepage, /how-it-works, /pricing, /trust) (PRD 05).
- Stripe checkout + lifecycle emails (PRD 06).
- Recovery workspace (broker / carrier / ACE paths) (PRD 02).
- Manual entry-extraction workflow in ops console (PRD 04).
- CAPE CSV builder + validator + Readiness Report PDF (PRD 03).
- Concierge upsell flow (purchase + engagement letter).
- Auth (Clerk), DB (Postgres + Drizzle), Storage (R2), Workflows (Inngest) wired up.
- Trust page + disclosures live (PRD 10).

Acceptance: a real customer can sign up, complete the screener, buy Recovery Kit, upload docs, receive a validated entry list, buy Prep, receive the Readiness Report — all without ops staff doing anything outside the console.

## Phase 1 — Ops scaling (Months 2–3)

**Goal**: bend the manual cost curve. Repeatable case ops; partner pilot.

Deliverables:
- Side-by-side document viewer + extraction form in ops (PRD 04).
- Outreach template library + personalization tokens.
- Reminder + stalled-case automation (Inngest cadences).
- Internal notes + @-mentions in cases.
- Better dashboards (queue health, SLA risk, ARPU).
- Partner referral attribution + dashboard (PRD 09 Tier 1).
- Mailbox forward integration (read-only).
- A/B testing framework on marketing pages.

Acceptance: time-per-case shrinks week over week; first partner referrals convert.

## Phase 2 — AI assist (Months 4–6)

**Goal**: OCR + LLM augment the analyst, not replace them. Confidence calibration in production.

Deliverables:
- OCR pipeline for 7501s and carrier invoices (PRD 08).
- LLM-drafted entry extraction with confidence + side-by-side analyst review.
- LLM-drafted Readiness Report notes (validator-finalized).
- Triage / queue routing assist.
- RAG knowledge surface in ops console.
- Adaptive reminder cadences.
- AI cost budgeting + per-case caps.
- Eval suite for every prompt template.

Acceptance: median analyst time per case drops by 40%+; first-pass QA rate improves; cost per case in budget.

## Phase 3 — Partner & enterprise expansion (Months 7–12)

**Goal**: partner motion is a meaningful share of revenue; first multi-tenant / co-branded partners live; foundation for enterprise.

Deliverables:
- Multi-tenant data model in production (orgs everywhere, RLS enforced).
- Co-branded screener embeds (PRD 09 Tier 2).
- White-label ready for first design-partner partner (Tier 3).
- Multi-entity case linking (parent IOR, child entities).
- Portfolio dashboard for enterprise prospects.
- Approval workflows on Concierge cases.
- Adjacent refund / recovery products (e.g., other duty-recovery scenarios reusing the entry chassis).
- SOC 2 Type I in-flight or completed.

Acceptance: ≥30% of new revenue from partner channel; one white-label live; one enterprise pilot signed.

## Cross-phase dependencies

```
Phase 0  ────► Phase 1  ────► Phase 2  ────► Phase 3
   │              │              │             │
   │              │              │             │
   ▼              ▼              ▼             ▼
Manual ops   Ops tooling    AI assist   Multi-tenant + partners
fully works  scales ops     bends cost   scales distribution
```

Skipping ahead is the failure mode. AI before ops is wrong. Enterprise before partners is wrong.

## Capacity assumptions

| Phase | Headcount (engineering + ops) |
| --- | --- |
| 0 | 1–2 eng, 1 ops, founder coverage |
| 1 | 2–3 eng, 2–3 ops |
| 2 | 3–4 eng, 4–5 ops, 1 ML |
| 3 | 4–6 eng, 5–7 ops, 1 ML, 1 partnerships |

If headcount lags, scope deferral order: AI > partner expansion > enterprise prep > ops tooling > MVP.

## Re-examining strategy

Every 30 days, re-answer:
- Are we still on the wedge?
- Is the cost curve bending?
- Is the next phase still the right next phase?
- Have any kill-criteria triggered (PRD 00 §7)?

The roadmap is a hypothesis, not a commitment.
