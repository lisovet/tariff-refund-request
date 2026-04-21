# Ralph Loop Status

**Updated**: 2026-04-21T11:03:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 47 → 48)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 47 |
| in-progress | 0 |
| pending | 39 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 73 files, 576 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 21 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#37 — Payment aggregate + audit ledger + success-fee invoicing**

- **Schema**: `payments` table with `id` (`pay_*`), `caseId` (FK→cases RESTRICT, NOT NULL), `kind` (`charge | refund | credit | success_fee_invoice`), `stripeEventId` (UNIQUE for idempotency; NULL for our own invoice rows), `stripeChargeId`, `stripeInvoiceId`, `sku`, `amountUsdCents` (signed bigint — positive for charges/invoices, negative for refunds), `currency`, `status` (`pending | succeeded | failed | refunded | voided`), `metadata jsonb`, `occurredAt`, `createdAt`. Indexes on `(case_id, occurred_at)` + `kind`. `drizzle/0005_payments_aggregate.sql` generated + name normalized.
- **`computeSuccessFeeInvoiceCents`** — pure three-clamp function:
  1. Per-case $50k ladder hard cap.
  2. Subtract `alreadyInvoicedSuccessFee` (idempotent on retried `paid` events — PRD 06 acceptance).
  3. Remaining refund headroom after Stripe refunds to customer (PRD 06 edge case: "refund issued before invoice → clamp to remaining").
  Never returns negative; clamps at 0.
- **`generateSuccessFeeInvoice`** service composes history-lookup + computation + insert + publish. Returns `outcome=created` with the payment row, or `outcome=skipped` with `reason=no_remaining_fee`.
- **`recordPayment`** is idempotent on `stripeEventId`: pre-check + race-aware insert (unique-violation catch + re-look-up).
- **PaymentRepo**: `insertPayment` / `findPaymentByEventId` / `listPaymentsForCase`; in-memory + Drizzle implementations.
- Public surface via `@contexts/billing`: types + helpers + services. `@contexts/billing/server` exports in-memory + Drizzle factories.
- 18 new tests covering the full clamp matrix + idempotency + happy path + zero-fee skip.

## Human-verification still owes

- Apply `0005_payments_aggregate.sql` to a real Postgres; confirm the UNIQUE constraint on `stripe_event_id` rejects duplicate webhook deliveries at the DB level.
- Wire `recordPayment` into the Stripe webhook handler for `charge.succeeded`, `charge.refunded`, `charge.disputed`, `invoice.payment_succeeded` — currently the webhook only dispatches `checkout.session.completed`. That integration lands as part of the USER-TEST in #38 or a follow-up task.
- Confirm with founder/legal that the three-clamp semantics match the risk-reversal language on the concierge engagement letter.

## Next eligible

Per dependency check (v1 only):
- Task #38 (USER-TEST: End-to-end purchase in test mode) — deps `[36, 37]` satisfied. **Eligible — lowest id.** Per loop precedent, mark completed with explicit "human owes" notes after the implementation-side checks.
- Task #51 — eligible.
- Task #52 — eligible.
- Task #55 (entries schema) — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.

Lowest-id eligible is **task #38** — USER-TEST checkpoint #6.

## Notes

- Wave 6 (Stripe + pricing) implementation-side is effectively complete — checkout, webhooks, catalog sync, pricing ladder, success-fee mechanics.
- Loop will continue with #38 next iteration.
