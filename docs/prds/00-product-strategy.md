# PRD 00 — Product Strategy

> Master strategy PRD. Every downstream PRD must reconcile with this one.
> For the "why this exists" narrative, see `docs/VISION.md`.

## 1. Strategic thesis

Submission readiness — not abstract refund analysis — is the paid product. The funnel monetizes the first real pain (locating entries), then the second (preparing a clean file), then the third (high-touch filing support). Each stage produces a concrete artifact the customer can hold.

## 2. Positioning

| We are | We are not |
| --- | --- |
| The fastest way to turn messy import records into a CAPE-ready refund claim. | A customs broker. |
| A productized service with human review on every artifact. | A law firm. |
| An event-driven business tied to the IEEPA refund window. | A generic trade-compliance SaaS. |
| A stage-paid ladder with an optional success fee. | An "AI files your claim" product. |
| A future partner-distribution platform for brokers and agencies. | A financing product. |

## 3. ICP (priority order)

1. **Ecommerce brands** using third-party brokers, DHL, FedEx, UPS, Flexport. Most fragmented records, most urgent need.
2. **SMB / lower mid-market importers**, 1–1000 entries/year.
3. **Broker / 3PL / agency channels** — once repeatable.
4. **Enterprise** — explicitly later.

## 4. Core bets

1. Customers pay first for **entry recovery**, not for abstract analysis.
2. "Filing prep" reads more concretely than "refund report."
3. A laddered price path outperforms one large jump to concierge.
4. Routing logic (broker / carrier / ACE) is **product logic**, not UX glue.
5. Human QA on submission artifacts is non-negotiable — and is the moat.

## 5. Explicit non-goals (at launch)

- Direct CBP submission.
- Enterprise multi-entity dashboards.
- Deep ERP integrations.
- Fully-automated document parsing (OCR is Phase 2).
- In-product legal advice.

## 6. Moat, in layers

```
Layer 4 — Partner distribution
Layer 3 — Ground-truth document dataset
Layer 2 — Human-reviewed submission readiness
Layer 1 — Routing + validation + CAPE schema encoded as domain code
Layer 0 — Operational playbook (queues, SLAs, QA)
```

Skipping layers to reach for automation or enterprise is the failure mode.

## 7. Kill criteria

We stop if, after the first 90 days:

- Free-screener → paid recovery conversion sits under the economic threshold (TBD, instrumented from day one).
- Prep cases routinely fail first-pass QA, implying the manual cost curve does not bend.
- Customers prefer using a broker directly over paying us for prep.
- Success-fee collection is unenforceable in practice.

## 8. Operating principles

- **Stage payments fund operations.** We do not run on a success-fee-only model.
- **Every artifact is human-reviewed** before it ships as "submission ready."
- **Routing decisions are code**, not case-by-case judgment.
- **Trust language is product**, not marketing — it lives on every screen.

## 9. Metrics we instrument on day one

| Metric | Why |
| --- | --- |
| Screener completion rate | Top-of-funnel health |
| Qualified → paid recovery conversion | First revenue event |
| Paid recovery → prep conversion | Core ladder integrity |
| Prep → concierge conversion | ARPU expansion |
| First-pass QA success rate | Ops cost trajectory |
| Time-per-case, by stage | Ops scalability |
| Docs-uploaded-to-prep-ready turnaround | Customer-facing speed |
| Refund-received rate (for filed cases) | End-to-end value delivery |
| Success-fee realized / invoiced | Monetization integrity |

## 10. Strategy-level open questions

1. Free screener vs low-cost screener?
2. Recovery Kit vs Recovery Service emphasis?
3. CAPE Prep bundled into Concierge, or sold separately?
4. ACE setup included or add-on?
5. Ecommerce-only at launch, or broader SMB?
6. OCR / automation timing?
7. Partner motion start date?

Answered or re-examined every 30 days.

## 11. Pipeline skills

Strategic work in this repo runs through a defined skill pipeline (see `~/.claude/CLAUDE.md`):

- `plan-ceo` — strategic filter on any new feature or capability before planning *how*. Skip for bug fixes / refactors.
- `planner` — execution planning with 10-pass adversarial review for anything touching 3+ files or design decisions.
- `critic` — adversarial PRD review before code is written.
- `prd-taskmaster` — generates this PRD set + backlog. Re-run when a PRD needs major revision.
- `claude-md-improver` — periodic audit of `CLAUDE.md` and `.claude/rules/`.

Surface-level taste skills are documented per-PRD (`docs/prds/01..11`) and bound by the Surface → skill mapping in `docs/DESIGN-LANGUAGE.md`.
