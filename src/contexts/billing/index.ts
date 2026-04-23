/**
 * Billing context — public surface (UI-safe).
 *
 * Per ADR 001 + the public-surface split convention from
 * @contexts/screener: this module exports types + pure helpers only,
 * so it can be pulled into client bundles. The Drizzle repo +
 * Stripe SDK + the inngest publish wiring live in
 * @contexts/billing/server.
 */

export type { Tier, TierId } from './tiers'
export { TIERS, TIER_ORDER, isTierId } from './tiers'

export {
  CUSTOMER_FACING_SKUS,
  TIER_TO_SKU,
  isCustomerFacingSku,
  skuForTier,
} from './tier-sku-bridge'

export type {
  BillingRepo,
  MarkEventInput,
  MarkEventResult,
} from './repo'

export type {
  GenerateSuccessFeeInvoiceDeps,
  GenerateSuccessFeeInvoiceInput,
  GenerateSuccessFeeInvoiceResult,
  InsertPaymentInput,
  InsertPaymentResult,
  PaymentRecord,
  PaymentRepo,
  RecordPaymentDeps,
  RecordPaymentInput,
  RecordPaymentResult,
  SuccessFeeInvoiceInput,
  SuccessFeeInvoicedPayload,
} from './payment-aggregate'
export {
  PAYMENT_KINDS,
  computeSuccessFeeInvoiceCents,
  generateSuccessFeeInvoice,
  recordPayment,
} from './payment-aggregate'

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

export type {
  CatalogSyncPlan,
  PriceArchivePlan,
  PriceCreatePlan,
  ProductArchivePlan,
  ProductCreatePlan,
  SkuRecurrence,
  StripeCatalogClient,
  StripeCatalogSnapshot,
  StripePriceSnapshot,
  StripeProductSnapshot,
} from './stripe-catalog'
export {
  CATALOG_APP_TAG,
  SKU_RECURRENCE,
  executeCatalogPlan,
  lookupKeyFor,
  planCatalogSync,
} from './stripe-catalog'

export type {
  BuildCheckoutInput,
  BuildIdempotencyInput,
} from './checkout'
export {
  CHECKOUT_IDEMPOTENCY_PREFIX,
  buildCheckoutSessionParams,
  buildIdempotencyKey,
} from './checkout'

export type {
  CheckoutClient,
  CreateCheckoutInput,
  CreateCheckoutResult,
} from './checkout'
export { createCheckoutForSku } from './checkout'

export type {
  Agreement,
  AgreementId,
  AgreementSku,
  AgreementVariables,
  RequiredClause,
} from './agreements/registry'
export {
  AGREEMENTS,
  REQUIRED_CLAUSES,
  renderAgreement,
  resolveAgreement,
} from './agreements/registry'

export type {
  ESignProvider,
  SignedAgreementRecord,
  SignedAgreementRepo,
  SignedAgreementStatus,
  RequestSignatureInput,
  RequestSignatureResult,
  RequestSignatureDeps,
  HandleSignatureInput,
  HandleSignatureResult,
  HandleSignatureDeps,
  ConciergeSignedEventData,
  ConciergeCheckoutGate,
} from './e-sign'
export {
  SIGNED_AGREEMENT_STATUSES,
  createInMemoryESignProvider,
  createInMemorySignedAgreementRepo,
  requestConciergeSignature,
  handleSignatureCompleted,
  conciergeCheckoutGate,
} from './e-sign'
