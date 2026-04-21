# ADR 005 — Stripe for stage-based pricing + success fees

**Status:** Accepted

## Context

The pricing model is layered: free screener, $99–499 entry-recovery products, $199–999 CAPE prep products, $999+ concierge with an 8–12% success fee on actual refunds received. We need (1) one-time payments per stage, (2) a way to charge a percentage success fee weeks or months later when CBP issues a refund, and (3) clean refund / credit handling for our risk-reversal promise.

## Decision

**Stripe** for everything money-related.

- One-time `Checkout` sessions for each stage product (recovery, prep, concierge).
- Success fees use **Stripe Invoices** created on demand when a refund is confirmed — `customer.invoice.created` webhook drives the `Payment` record.
- Refunds and credits via the Stripe API, mirrored to a local `Payment` aggregate for our own reporting.
- Pricing ladder lives in code (`src/contexts/billing/pricing.ts`) — it is product logic, not just config.

## Consequences

- ✅ Battle-tested money primitives. No PCI scope.
- ✅ Stripe handles tax (Stripe Tax), receipts, and disputes.
- ⚠️ Success-fee invoicing requires careful state — we must not double-bill. Idempotency keys on every invoice creation.
- ⚠️ The pricing-ladder logic is ours; Stripe just executes. Test it like domain code.

## Test-impact

- Unit tests use `stripe-mock` for fast iteration.
- Integration tests use real Stripe test-mode keys with the Stripe CLI for webhook delivery.
- Webhook handlers must be idempotent — verified by replaying the same event in tests.
