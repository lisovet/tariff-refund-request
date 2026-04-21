# Vision

> The fastest, most trustworthy way for a U.S. importer to go from
> *"I think I paid these tariffs"* to
> *"I have a validated, submission-ready refund package."*

---

## What we are building

An event-driven, service-heavy platform that monetizes the operational reality of the IEEPA refund wave: most importers do not know whether they qualify, do not have a clean entry list, do not understand ACE/CAPE prerequisites, and cannot reliably build a compliant CAPE declaration file on their own.

We are **not** building:

- A generic customs SaaS platform.
- A trade-compliance suite.
- A law firm or customs brokerage.
- An "AI files your refund" product.
- A financing product.
- An enterprise multi-entity dashboard at launch.

We **are** building:

- An eligibility screener that qualifies a lead in under three minutes.
- An entry-recovery workflow that turns fragmented broker / carrier / ACE records into a clean, validated entry list.
- A CAPE filing-prep engine that produces a CBP-compliant CSV and a human-reviewed readiness report.
- A concierge tier for high-touch support, with a success fee on real refunds received.

---

## The thesis (in one sentence)

> **Submission readiness — not abstract refund analysis — is the paid product.**

The market's first pain is not "what's my refund opportunity?" It is:

1. *Am I in scope?*
2. *Where are my entry numbers?*
3. *Is this data clean enough to file?*
4. *Is the CSV and prerequisites set submission-ready?*

Every product, price, and screen we ship descends from those four questions. If a feature does not move a customer along that arc, we do not build it.

---

## Why this exists now

The IEEPA tariff refund window is event-driven and time-bounded. The customers who need help most — ecommerce SMBs, lower mid-market importers — are also the ones whose records are most fragmented across brokers, carriers, AP systems, and ACE accounts they barely use. Existing customs platforms are built for in-house trade teams at large enterprises. There is no productized service that meets the SMB importer where they actually are: with a Shopify store, a Flexport invoice or two, a folder of DHL duty bills, and an ACE login they have never used.

We turn that mess into a CAPE-ready file. That is the offer.

---

## The narrowest launch wedge

> U.S. ecommerce and SMB importers who likely paid IEEPA tariffs, do not have a clean entry list, and need help turning fragmented broker / carrier / ACE records into a submission-ready CAPE package.

This is narrower and stronger than "all importers with exposure." We will hold this wedge until the recovery + prep motion is repeatable and operationally clean.

---

## Funnel and revenue model

```
Traffic
  │
  ▼
┌───────────────────────────────┐
│ Free eligibility screener     │   lead capture, qualification, routing
└───────────────────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ Entry Recovery                │   $99–499 — first paid conversion
│   • Recovery Kit (self-guided)│
│   • Recovery Service (assist) │
└───────────────────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ CAPE Filing Prep              │   $199–999 — core tactical deliverable
│   • Validated entry list      │
│   • CBP-compliant CSV         │
│   • Human-reviewed readiness  │
└───────────────────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ Concierge Filing Support      │   $999+ + 8–12% success fee
│   • Filing actor coordination │
│   • ACE/ACH support           │
│   • Status monitoring         │
└───────────────────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ Expansion                     │   $299–999/mo — recurring & channel
│   • Monitoring                │
│   • Partner / agency portals  │
│   • Multi-entity              │
└───────────────────────────────┘
```

### Pricing ladder

| Layer | Offer | SMB | Mid-market |
| --- | --- | --- | --- |
| 1 | Eligibility Screener | Free | Free |
| 2a | Entry Recovery Kit | $99 | $299 |
| 2b | Entry Recovery Service | $299 | $499 |
| 3 | CAPE Filing Prep | $199–499 | $499–999 |
| 4 | Concierge | $999+ | $1,999+ |
| 4b | Success fee (on actual refund) | 10–12% | 8–10% |
| 5 | Monitoring | $299/mo | $999/mo |

### Why the ladder, not one big jump

The original plan jumped from "free audit" to "expensive managed service" — too much friction, too little proof. The ladder monetizes the **first real pain** (locating entries) before asking for premium service. Entry recovery and filing prep both produce concrete artifacts customers can hold; concierge sells the trust we have already earned by then.

---

## Moat

The defensibility is not abstract IP. It is operational compounding:

1. **Entry-reconstruction workflows** that handle real-world broker / carrier / ACE chaos.
2. **Routing logic** by source path — a typed strategy the product enforces, not UI glue.
3. **Validation logic** and clean-batch preparation specific to CAPE.
4. **Human-reviewed submission readiness** — the trust we sell.
5. **Document ground-truth dataset** accumulated case by case, which seeds Phase-2 OCR and AI assist.
6. **Partner distribution** once the playbook is proven and brokers / 3PLs / agencies want a referral lane.

The moat compounds in that order. Skipping early steps for AI/automation is the trap.

---

## Strategic non-goals

- No direct CBP submission from our system.
- No generic customs/trade SaaS framing.
- No enterprise multi-entity dashboards at launch.
- No fully-automated document parsing in v1 (OCR is Phase 2).
- No legal-advice workflows.
- No success-fee-only model. Stage payments fund operations.

---

## Core bets

1. Customers pay first for **entry recovery**, not abstract analysis.
2. Customers trust **file prep** more than "AI refund estimation."
3. A cleaner mid-funnel offer outperforms a too-large jump to premium service.
4. **Routing logic is core product logic**, not just UX.
5. **Human QA on submission artifacts is non-negotiable** — and is itself the product's most defensible feature.

---

## ICP priority

| Priority | ICP | Why |
| --- | --- | --- |
| 1 | Ecommerce brands using brokers, DHL, FedEx, UPS, Flexport | Highest fragmentation, urgent need |
| 2 | SMB / lower mid-market importers (1–1000 entries) | Strong fit for paid recovery + prep |
| 3 | Broker / 3PL / agency channels | Scale once workflow is repeatable |
| 4 | Enterprise | Later — after partner motion proves out |

---

## What success looks like

### 30 days
- Screener → paid recovery conversion measurable and ≥ baseline (TBD).
- 10 paid Entry Recovery cases delivered end-to-end.
- 5 CAPE Prep packages delivered with a clean QA pass on first review.

### 90 days
- Repeatable ops playbook: time-per-case shrinking week over week.
- First concierge upsell from a Prep customer.
- Partner pilot with one broker or agency.

### 6 months
- OCR / extraction assist live for the highest-volume document types.
- AI-drafted readiness notes (human-finalized).
- Partner motion producing a measurable share of new leads.

### 12 months
- Multi-tenant / white-label flows for partner portals.
- Adjacent refund / recovery products built on the same chassis.
- The platform — not the founder — is the brand.

---

## Trust posture (the product UX promise)

In 30 seconds on any screen, a user must understand:

- What stage they are in.
- What they are paying for.
- What output they will receive.
- What is still their responsibility.
- That the output is human-reviewed.

This is not a marketing claim — it is a UX constraint that drives screen design across the product. See `docs/DESIGN-LANGUAGE.md` for how the visual system encodes that trust.

---

## Founder-level open questions (carried into PRDs)

1. What % convert from free screener → paid recovery?
2. Which recovery path converts best: broker / carrier / ACE?
3. Best entry product: Recovery Kit, Recovery Service, or Filing Prep?
4. How many users have ACE but no idea how to export from it?
5. How often does missing liquidation status block prep?
6. What % upgrade from Prep → Concierge?

These questions structure the metrics we instrument on day one.

---

## In one sentence

> **We help importers figure out if they qualify, recover the entry numbers they need, and prepare a clean CAPE-ready refund file with human-reviewed support.**

Everything in this repo flows from that sentence.
