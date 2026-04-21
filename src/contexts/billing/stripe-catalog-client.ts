import 'server-only'
import type Stripe from 'stripe'
import {
  CATALOG_APP_TAG,
  type StripeCatalogClient,
  type StripeCatalogSnapshot,
  type StripeProductSnapshot,
} from './stripe-catalog'

/**
 * Adapter that bridges the executor's narrow `StripeCatalogClient`
 * surface to the real Stripe SDK. Server-only because it talks to
 * the network.
 *
 * Snapshot loader pages through every product+price tagged with our
 * app metadata. We tolerate other apps sharing the same Stripe
 * account by filtering on `metadata.app === CATALOG_APP_TAG` at the
 * planner level.
 */

export function createStripeCatalogClient(stripe: Stripe): StripeCatalogClient {
  return {
    async createProduct(input) {
      const product = await stripe.products.create({
        name: input.name,
        metadata: input.metadata,
        active: true,
      })
      return { id: product.id }
    },
    async createPrice(input) {
      const params: Stripe.PriceCreateParams = {
        product: input.productId,
        currency: input.currency,
        unit_amount: input.unitAmountCents,
        lookup_key: input.lookupKey,
        metadata: input.metadata,
      }
      if (input.recurring) {
        params.recurring = {
          interval: input.recurring.interval,
          interval_count: input.recurring.interval_count,
        }
      }
      const price = await stripe.prices.create(params)
      return { id: price.id }
    },
    async archivePrice(priceId) {
      await stripe.prices.update(priceId, { active: false })
    },
    async archiveProduct(productId) {
      await stripe.products.update(productId, { active: false })
    },
    async findProductIdByMetadata({ sku, tier }) {
      const result = await stripe.products.search({
        query: `metadata['app']:'${CATALOG_APP_TAG}' AND metadata['sku']:'${sku}' AND metadata['tier']:'${tier}'`,
        limit: 1,
      })
      return result.data[0]?.id
    },
  }
}

export async function loadStripeCatalogSnapshot(
  stripe: Stripe,
): Promise<StripeCatalogSnapshot> {
  const products: StripeProductSnapshot[] = []

  for await (const product of stripe.products.list({ limit: 100, active: true })) {
    if (product.metadata?.app !== CATALOG_APP_TAG) continue
    const prices = await stripe.prices.list({
      product: product.id,
      limit: 100,
    })
    products.push({
      id: product.id,
      name: product.name,
      active: product.active,
      metadata: { ...product.metadata },
      prices: prices.data.map((p) => ({
        id: p.id,
        active: p.active,
        currency: p.currency,
        unit_amount: p.unit_amount,
        lookup_key: p.lookup_key,
        metadata: { ...p.metadata },
        recurring: p.recurring
          ? {
              interval: p.recurring.interval,
              interval_count: p.recurring.interval_count,
            }
          : null,
      })),
    })
  }

  return { products }
}
