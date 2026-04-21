/**
 * Billing context — public surface (UI-safe).
 *
 * Per ADR 001 + the public-surface split convention from
 * @contexts/screener: this module exports types + pure helpers only,
 * so it can be pulled into client bundles. The Drizzle repo +
 * Stripe SDK + the inngest publish wiring live in
 * @contexts/billing/server.
 */

export type {
  BillingRepo,
  MarkEventInput,
  MarkEventResult,
} from './repo'

export type {
  HandleStripeEventInput,
  HandleStripeEventDeps,
  HandleStripeEventResult,
  PaymentCompletedPayload,
} from './event-handler'

export { handleStripeEvent } from './event-handler'

export type {
  PricingTier,
  Sku,
  MoneyCents,
  FractionRange,
  TierInput,
  SuccessFeeInput,
} from './pricing'
export {
  PRICE_LADDER,
  SUCCESS_FEE_RATES,
  SUCCESS_FEE_HARD_CAP,
  determineTier,
  priceFor,
  computeSuccessFeeCents,
} from './pricing'
