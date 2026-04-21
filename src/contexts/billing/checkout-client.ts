import 'server-only'
import type Stripe from 'stripe'
import type { CheckoutClient } from './checkout'

/**
 * Real Stripe-backed adapter for the CheckoutClient surface defined in
 * `checkout.ts`. Network access — server-only.
 */
export function createStripeCheckoutClient(stripe: Stripe): CheckoutClient {
  return {
    async findPriceIdByLookupKey(lookupKey) {
      const result = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      })
      return result.data[0]?.id
    },
    async createCheckoutSession(params, opts) {
      const session = await stripe.checkout.sessions.create(params, {
        idempotencyKey: opts.idempotencyKey,
      })
      return { id: session.id, url: session.url }
    },
  }
}
