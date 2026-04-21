# PRD 06 — Monetization & Pricing

## Purpose

Codify the stage-based pricing ladder, the success-fee mechanics, and the risk-reversal promise. Pricing is product, not config — it lives in code (`src/contexts/billing/pricing.ts`).

## Pricing philosophy

- **Progressive monetization beats one big jump.** Recovery → Prep → Concierge is the ladder.
- **Stage payments fund operations.** Success-fee-only is rejected — it misaligns incentives and starves the manual cost curve.
- **The first paid step is the hardest.** Recovery Kit at $99 is intentionally low-friction.
- **Mid-market pays for time, not features.** Service tier prices reflect human-hour cost.

## The ladder (canonical)

| Stage | SKU | SMB | Mid-market | What customer gets |
| --- | --- | --- | --- | --- |
| 1 | Eligibility Screener | Free | Free | Qualification, refund estimate, recovery routing |
| 2a | Entry Recovery Kit | $99 | $299 | Outreach templates, checklist, upload portal, walkthrough |
| 2b | Entry Recovery Service | $299 | $499 | Kit + analyst-assisted extraction & follow-up |
| 3a | CAPE Filing Prep — Standard | $199 | $499 | Validated CSV + Readiness Report |
| 3b | CAPE Filing Prep — Premium | $499 | $999 | Standard + cover letter, batch grouping, ACE/ACH guide |
| 4 | Concierge — Base | $999 | $1,999 | Per-case high-touch support |
| 4b | Success fee | 10–12% | 8–10% | Of actual refund received |
| 5 | Monitoring | $299/mo | $999/mo | Ongoing tariff exposure + new-refund alerts |

Mid-market threshold (rough): >100 entries OR >$50k duty paid in IEEPA window.

## Risk reversal

If we cannot identify plausible eligible entries from the customer's submitted materials within 14 days, we either:
1. Convert the paid amount to a credit toward Concierge, or
2. Refund a defined portion (50–100% depending on stage and effort).

We never guarantee CBP refund approval. The promise is about our work, not CBP's outcome.

## Success-fee mechanics

- Triggered when the customer (or coordinator) marks `paid` state in the case machine.
- Calculated against the realized refund amount, **not** the pre-filing estimate.
- Invoiced via Stripe with a 14-day net term.
- Capped at the per-case ladder maximum (so we never bill more than the refund amount makes reasonable).
- Idempotent — duplicate `paid` events do not create duplicate invoices.
- A signed engagement agreement at Concierge purchase is the legal basis for the fee.

## Pricing as code

```ts
// src/contexts/billing/pricing.ts
export type PricingTier = 'smb' | 'mid_market'

export type Sku =
  | 'recovery_kit'
  | 'recovery_service'
  | 'cape_prep_standard'
  | 'cape_prep_premium'
  | 'concierge_base'
  | 'monitoring'

export const PRICE_LADDER: Record<Sku, Record<PricingTier, USD>> = { ... }

export const SUCCESS_FEE_RATES: Record<PricingTier, FractionRange> = {
  smb: { min: 0.10, max: 0.12 },
  mid_market: { min: 0.08, max: 0.10 },
}

export const determineTier = (case: Case): PricingTier => { ... }
```

The Stripe product/price catalog is generated from this file via a deploy-time sync script — the code is the source of truth.

## ARPU expansion path

```
$0 (free screener)
  ▼
$99–499 (recovery)
  ▼
$199–999 (prep)
  ▼
$999+ (concierge) + 8–12% success fee
  ▼
$299–999/mo (monitoring) + partner / multi-entity expansion
```

Target blended ARPU at 12 months: **$1,800 per qualified lead through full ladder.**

## Acceptance criteria

- **Given** a tier-determined customer purchasing Recovery Kit,
  **When** Stripe Checkout completes,
  **Then** the case transitions `awaiting_purchase` → `awaiting_docs` and a workspace is provisioned.
- **Given** a Concierge case marked `paid` with a confirmed refund amount,
  **When** the success-fee invoice is generated,
  **Then** the invoice amount equals `refund * rate` clamped to ladder max, and is idempotent against retried `paid` events.
- **Given** a customer triggers the risk-reversal clause,
  **When** an admin issues credit or refund,
  **Then** the action is recorded in the audit log with the reason and stage at time of trigger.
- **Given** the pricing-ladder code changes,
  **When** the deploy-time sync runs,
  **Then** Stripe products/prices reflect the new ladder and old prices are archived (not deleted).

## Edge case inventory

- Customer on a discount code → applied at Checkout; ledgered as the discount in our `Payment` record.
- Refund issued before success-fee invoice → invoice clamps to remaining amount.
- Refund issued after success-fee invoiced + paid → reverse fee logic kicks in (admin-driven).
- Customer disputes Stripe charge → case state holds; coordinator notified; audit row.
- Currency: USD only at v1; Stripe accepts customer's card currency, settlement always USD.
- Tax (Stripe Tax) — applied to recovery + prep + concierge; success fee invoiced as services, tax handled per Stripe Tax rules.
- Partner referrals — partner share calculation deferred to PRD 09; v1 records source only.
- Annual prepay for Monitoring — supported; discount of two months free.
- Refund window — 14 days from purchase for Recovery Kit; per-engagement clause for higher SKUs.
- Subscription cancellation (Monitoring) — no fee; export of historical data offered.
- Stage skip — customer wants to buy Prep without Recovery (rare, requires they already have a clean entry list); allowed but flagged for ops review.
- Pricing change mid-case — case is grandfathered to the price at start.
- Multiple cases under one customer — billed per case; volume discount manually applied at admin discretion.

## Design notes (taste)

### Skills

- **Taste — pricing page**: `minimalist-ui` (inherits from PRD 05 marketing surface).
- **Taste — Concierge purchase / engagement letter flow**: `minimalist-ui` editorial-document mode.
- **Pair with**: `full-output-enforcement` for the engagement-letter renderer.
- **Other (critical)**: `test-driven-development` for `src/contexts/billing/pricing.ts` — SMB / mid-market boundaries, success-fee math, refund clamp logic, idempotency on Stripe retries. `software-architecture` when shaping the public surface of `src/contexts/billing/`. `claude-api` does **not** apply here — there is no LLM in pricing.
- Invoke via `/taste-skill stage-by-stage pricing page with tabular figures, free tier rendered with same weight as paid tiers, no popular badge`.
- **Apply from `minimalist-ui`**: hairline-divided pricing rows, generous internal padding, monospace numerics, no shadows, no rounded-full pill plan badges.
- **Override from `docs/DESIGN-LANGUAGE.md`**: customs-orange `--accent` only on the single "Get started" CTA per stage column. Pricing-table source of truth is `pricing.ts` rendered via snapshot — never hand-typed numbers.
- **Cross-cutting + extra gates** (per `docs/SKILLS-ROUTING.md`): `planner` → `coder` → `qa-monkey` (focus on Stripe webhook idempotency, refund clamp logic, success-fee race conditions) → `judge` → `ship`. `security-review` on any change touching billing flow or engagement-letter capture. Once traffic exists, `copywriting-optimizer` runs A/B tests on the pricing page (subject to PRD 05's design-language gate).

### Aesthetic intent

- Pricing page is tabular, mono numbers, hairline-divided rows. No colored "popular" badge.
- The "Free" tier is set in the same face and weight as the paid tiers — no visual de-emphasis. Competence implies confidence in the free step.
- Success-fee disclosure is prominent on the Concierge page — restraint demands transparency.

## Out of scope

- Self-serve enterprise quoting.
- ACH-direct billing (Stripe-only at v1).
- Cryptocurrency payments.
- Refundable deposits.
