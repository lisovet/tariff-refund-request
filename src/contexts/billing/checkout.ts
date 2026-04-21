import type Stripe from 'stripe'
import type { PricingTier, Sku } from './pricing'
import {
  CATALOG_APP_TAG,
  SKU_RECURRENCE,
  lookupKeyFor,
} from './stripe-catalog'

/**
 * Inferred from the SDK's `sessions.create` signature so we don't
 * depend on TypeScript resolving `Stripe.Checkout.SessionCreateParams`
 * through the namespace re-export (which is unreliable across SDK
 * versions and TS releases).
 */
type SessionCreateParams = NonNullable<
  Parameters<Stripe['checkout']['sessions']['create']>[0]
>
type SessionMode = NonNullable<SessionCreateParams['mode']>

/**
 * Stripe Checkout session construction per PRD 06.
 *
 * Pure builder + idempotency-key generator separated from the actual
 * stripe.checkout.sessions.create call. The builder is testable
 * deterministically; the adapter (`createCheckoutSession`) lives in
 * `checkout-client.ts` and talks to Stripe.
 *
 * The webhook (event-handler.ts) reads `metadata.screenerSessionId`
 * and `metadata.sku` from the resulting Checkout session. They MUST
 * be set here or the platform/payment.completed event won't carry
 * enough context for downstream workflows.
 */

export const CHECKOUT_IDEMPOTENCY_PREFIX = 'trr_checkout'

export interface BuildCheckoutInput {
  readonly sku: Sku
  readonly tier: PricingTier
  readonly screenerSessionId: string
  readonly priceId: string
  readonly origin: string
  readonly customerEmail?: string
}

export function buildCheckoutSessionParams(
  input: BuildCheckoutInput,
): SessionCreateParams {
  const recurring = SKU_RECURRENCE[input.sku]
  const mode: SessionMode = recurring === 'one_time' ? 'payment' : 'subscription'

  const metadata = {
    screenerSessionId: input.screenerSessionId,
    sku: input.sku,
    tier: input.tier,
    app: CATALOG_APP_TAG,
  }

  const params: SessionCreateParams = {
    mode,
    line_items: [{ price: input.priceId, quantity: 1 }],
    metadata,
    success_url: `${input.origin}/checkout/success?session={CHECKOUT_SESSION_ID}&screener=${encodeURIComponent(
      input.screenerSessionId,
    )}`,
    cancel_url: `${input.origin}/checkout/cancel?screener=${encodeURIComponent(
      input.screenerSessionId,
    )}`,
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
  }

  if (input.customerEmail) {
    params.customer_email = input.customerEmail
  }

  if (mode === 'subscription') {
    params.subscription_data = { metadata }
  }

  return params
}

export interface BuildIdempotencyInput {
  readonly sku: Sku
  readonly tier: PricingTier
  readonly screenerSessionId: string
}

export function buildIdempotencyKey(input: BuildIdempotencyInput): string {
  return `${CHECKOUT_IDEMPOTENCY_PREFIX}__${lookupKeyFor(input.sku, input.tier)}__${input.screenerSessionId}`
}

/**
 * Narrow Stripe-shaped surface needed to open a Checkout for a SKU.
 * Tests pass a fake; the real adapter wraps Stripe.checkout.sessions
 * and Stripe.prices.list in `checkout-client.ts`.
 *
 * The price is resolved by lookup_key (set up by the catalog sync,
 * `trr__<sku>__<tier>`) so callers never hardcode Stripe price IDs.
 */
export interface CheckoutClient {
  findPriceIdByLookupKey(lookupKey: string): Promise<string | undefined>
  createCheckoutSession(
    params: SessionCreateParams,
    opts: { idempotencyKey: string },
  ): Promise<{ id: string; url: string | null }>
}

export interface CreateCheckoutInput {
  readonly sku: Sku
  readonly tier: PricingTier
  readonly screenerSessionId: string
  readonly origin: string
  readonly customerEmail?: string
}

export interface CreateCheckoutResult {
  readonly sessionId: string
  readonly url: string | null
}

export async function createCheckoutForSku(
  input: CreateCheckoutInput,
  client: CheckoutClient,
): Promise<CreateCheckoutResult> {
  const lookupKey = lookupKeyFor(input.sku, input.tier)
  const priceId = await client.findPriceIdByLookupKey(lookupKey)
  if (!priceId) {
    throw new Error(
      `no Stripe price for ${lookupKey} — run \`npm run stripe:sync\` to materialize the catalog`,
    )
  }

  const params = buildCheckoutSessionParams({
    sku: input.sku,
    tier: input.tier,
    screenerSessionId: input.screenerSessionId,
    priceId,
    origin: input.origin,
    customerEmail: input.customerEmail,
  })

  const idempotencyKey = buildIdempotencyKey({
    sku: input.sku,
    tier: input.tier,
    screenerSessionId: input.screenerSessionId,
  })

  const session = await client.createCheckoutSession(params, { idempotencyKey })
  return { sessionId: session.id, url: session.url }
}
