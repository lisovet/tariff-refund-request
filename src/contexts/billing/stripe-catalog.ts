import { PRICE_LADDER, type PricingTier, type Sku } from './pricing'

/**
 * Stripe catalog reconciliation per PRD 06.
 *
 * `pricing.ts` is the source of truth. This module produces a *plan*
 * for what Stripe should look like — separate from the script that
 * applies it. The plan is pure and testable; the executor talks to
 * Stripe.
 *
 * Idempotency contract: applying the plan against Stripe, then
 * re-running the planner against the resulting snapshot, must yield
 * `isNoOp: true`. The catalog tests freeze that property.
 */

/**
 * Tag every product/price we own so we can distinguish from anything
 * else in the same Stripe account (other apps, manual experiments,
 * historical SKUs from before this script existed).
 */
export const CATALOG_APP_TAG = 'tariff-refund-request'

export type SkuRecurrence =
  | 'one_time'
  | { readonly interval: 'month'; readonly interval_count: 1 }

export const SKU_RECURRENCE: Readonly<Record<Sku, SkuRecurrence>> = {
  recovery_kit: 'one_time',
  recovery_service: 'one_time',
  cape_prep_standard: 'one_time',
  cape_prep_premium: 'one_time',
  concierge_base: 'one_time',
  monitoring: { interval: 'month', interval_count: 1 },
} as const

export function lookupKeyFor(sku: Sku, tier: PricingTier): string {
  return `trr__${sku}__${tier}`
}

export interface StripePriceSnapshot {
  readonly id: string
  readonly active: boolean
  readonly currency: string
  readonly unit_amount: number | null
  readonly lookup_key: string | null
  readonly metadata: Record<string, string>
  readonly recurring: { readonly interval: string; readonly interval_count: number } | null
}

export interface StripeProductSnapshot {
  readonly id: string
  readonly name: string
  readonly active: boolean
  readonly metadata: Record<string, string>
  readonly prices: readonly StripePriceSnapshot[]
}

export interface StripeCatalogSnapshot {
  readonly products: readonly StripeProductSnapshot[]
}

export interface ProductCreatePlan {
  readonly name: string
  readonly metadata: { readonly sku: string; readonly tier: string; readonly app: string }
}

export interface PriceCreatePlan {
  readonly sku: Sku
  readonly tier: PricingTier
  readonly currency: 'usd'
  readonly unitAmountCents: number
  readonly lookupKey: string
  readonly metadata: { readonly sku: string; readonly tier: string; readonly app: string }
  readonly recurring?: { readonly interval: 'month'; readonly interval_count: 1 }
}

export interface PriceArchivePlan {
  readonly priceId: string
  readonly reason: 'amount_drift' | 'extra_price' | 'sku_removed'
}

export interface ProductArchivePlan {
  readonly productId: string
  readonly reason: 'sku_removed'
}

export interface CatalogSyncPlan {
  readonly productsToCreate: readonly ProductCreatePlan[]
  readonly pricesToCreate: readonly PriceCreatePlan[]
  readonly pricesToArchive: readonly PriceArchivePlan[]
  readonly productsToArchive: readonly ProductArchivePlan[]
  readonly diff: readonly string[]
  readonly isNoOp: boolean
}

const TIERS: readonly PricingTier[] = ['smb', 'mid_market'] as const
const SKUS = Object.keys(PRICE_LADDER) as readonly Sku[]

function productNameFor(sku: Sku, tier: PricingTier): string {
  return `${sku} (${tier})`
}

function priceMatchesLadder(
  price: StripePriceSnapshot,
  expectedAmount: number,
  expectedRecurrence: SkuRecurrence,
  expectedLookupKey: string,
): boolean {
  if (!price.active) return false
  if (price.currency !== 'usd') return false
  if (price.unit_amount !== expectedAmount) return false
  if (price.lookup_key !== expectedLookupKey) return false

  if (expectedRecurrence === 'one_time') return price.recurring === null
  if (price.recurring === null) return false
  return (
    price.recurring.interval === expectedRecurrence.interval &&
    price.recurring.interval_count === expectedRecurrence.interval_count
  )
}

function findOwnedProduct(
  snapshot: StripeCatalogSnapshot,
  sku: Sku,
  tier: PricingTier,
): StripeProductSnapshot | undefined {
  return snapshot.products.find(
    (p) =>
      p.metadata.app === CATALOG_APP_TAG &&
      p.metadata.sku === sku &&
      p.metadata.tier === tier,
  )
}

export function planCatalogSync(snapshot: StripeCatalogSnapshot): CatalogSyncPlan {
  const productsToCreate: ProductCreatePlan[] = []
  const pricesToCreate: PriceCreatePlan[] = []
  const pricesToArchive: PriceArchivePlan[] = []
  const productsToArchive: ProductArchivePlan[] = []
  const diff: string[] = []

  const ladderKeys = new Set<string>()

  for (const sku of SKUS) {
    for (const tier of TIERS) {
      const ladderKey = `${sku}__${tier}`
      ladderKeys.add(ladderKey)

      const expectedAmount = PRICE_LADDER[sku][tier].usdCents
      const expectedRecurrence = SKU_RECURRENCE[sku]
      const lookupKey = lookupKeyFor(sku, tier)
      const product = findOwnedProduct(snapshot, sku, tier)

      if (!product || !product.active) {
        productsToCreate.push({
          name: productNameFor(sku, tier),
          metadata: { sku, tier, app: CATALOG_APP_TAG },
        })
        diff.push(`+ product ${sku}/${tier}`)
        pricesToCreate.push(buildPriceCreate(sku, tier, expectedAmount, expectedRecurrence, lookupKey))
        diff.push(
          `+ price ${lookupKey} = $${formatDollars(expectedAmount)} (${recurrenceLabel(expectedRecurrence)})`,
        )
        continue
      }

      const matching = product.prices.find((p) =>
        priceMatchesLadder(p, expectedAmount, expectedRecurrence, lookupKey),
      )

      if (!matching) {
        const driftPrice = product.prices.find(
          (p) => p.active && p.lookup_key === lookupKey && p.unit_amount !== expectedAmount,
        )
        if (driftPrice) {
          pricesToArchive.push({ priceId: driftPrice.id, reason: 'amount_drift' })
          diff.push(
            `~ archive price ${driftPrice.id} ($${formatDollars(driftPrice.unit_amount ?? 0)} → $${formatDollars(expectedAmount)})`,
          )
        }
        pricesToCreate.push(buildPriceCreate(sku, tier, expectedAmount, expectedRecurrence, lookupKey))
        diff.push(
          `+ price ${lookupKey} = $${formatDollars(expectedAmount)} (${recurrenceLabel(expectedRecurrence)})`,
        )
      }

      // Archive any extra active prices the product carries that we
      // don't own (matching app tag but no lookup-key match).
      for (const p of product.prices) {
        if (!p.active) continue
        if (matching && p.id === matching.id) continue
        if (p.lookup_key === lookupKey && p.unit_amount !== expectedAmount) {
          // Already covered by amount_drift above.
          continue
        }
        if (p.lookup_key === lookupKey) {
          // Same lookup key + same amount as expected: this is the
          // matching price, already handled.
          continue
        }
        pricesToArchive.push({ priceId: p.id, reason: 'extra_price' })
        diff.push(`~ archive extra price ${p.id} (lookup_key=${p.lookup_key ?? 'null'})`)
      }
    }
  }

  // Anything we own that's not in the ladder anymore.
  for (const product of snapshot.products) {
    if (product.metadata.app !== CATALOG_APP_TAG) continue
    if (!product.active) continue
    const sku = product.metadata.sku
    const tier = product.metadata.tier
    if (!sku || !tier) continue
    if (ladderKeys.has(`${sku}__${tier}`)) continue
    productsToArchive.push({ productId: product.id, reason: 'sku_removed' })
    diff.push(`~ archive obsolete product ${product.id} (${sku}/${tier})`)
  }

  const isNoOp =
    productsToCreate.length === 0 &&
    pricesToCreate.length === 0 &&
    pricesToArchive.length === 0 &&
    productsToArchive.length === 0

  return {
    productsToCreate,
    pricesToCreate,
    pricesToArchive,
    productsToArchive,
    diff,
    isNoOp,
  }
}

function buildPriceCreate(
  sku: Sku,
  tier: PricingTier,
  unitAmountCents: number,
  recurrence: SkuRecurrence,
  lookupKey: string,
): PriceCreatePlan {
  const base = {
    sku,
    tier,
    currency: 'usd' as const,
    unitAmountCents,
    lookupKey,
    metadata: { sku, tier, app: CATALOG_APP_TAG },
  }
  if (recurrence === 'one_time') return base
  return { ...base, recurring: recurrence }
}

function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

function recurrenceLabel(recurrence: SkuRecurrence): string {
  if (recurrence === 'one_time') return 'one-time'
  return `${recurrence.interval_count}/${recurrence.interval}`
}

/**
 * Stripe-shaped client surface needed by the executor. Real
 * implementation lives in `stripe-catalog-client.ts`; tests pass a
 * fake. Keeping this narrow lets the executor stay independent of any
 * particular Stripe SDK version.
 */
export interface StripeCatalogClient {
  createProduct(input: ProductCreatePlan): Promise<{ id: string }>
  createPrice(
    input: PriceCreatePlan & { productId: string },
  ): Promise<{ id: string }>
  archivePrice(priceId: string): Promise<void>
  archiveProduct(productId: string): Promise<void>
  /**
   * Look up a Stripe product by our metadata tags. Used when the
   * executor needs the `productId` for a price create on an
   * already-existing product (i.e. only the price drifted).
   */
  findProductIdByMetadata(query: {
    sku: string
    tier: string
  }): Promise<string | undefined>
}

export interface CatalogExecutionResult {
  readonly applied: {
    readonly products: { readonly created: number; readonly archived: number }
    readonly prices: { readonly created: number; readonly archived: number }
  }
  readonly newProductIds: ReadonlyMap<string, string>
}

export async function executeCatalogPlan(
  plan: CatalogSyncPlan,
  client: StripeCatalogClient,
): Promise<CatalogExecutionResult> {
  // Order matters: products before prices (a price needs a product),
  // then archive stale prices, then archive obsolete products (an
  // active product can't be archived if it has the only active
  // price for the case the caller is migrating away from — in
  // practice we archive prices first to avoid dangling).

  const newProductIds = new Map<string, string>()
  for (const create of plan.productsToCreate) {
    const { id } = await client.createProduct(create)
    newProductIds.set(`${create.metadata.sku}__${create.metadata.tier}`, id)
  }

  for (const create of plan.pricesToCreate) {
    const key = `${create.sku}__${create.tier}`
    const productId =
      newProductIds.get(key) ??
      (await client.findProductIdByMetadata({ sku: create.sku, tier: create.tier }))
    if (!productId) {
      throw new Error(
        `executeCatalogPlan: no product id available for price ${create.lookupKey} — plan inconsistent`,
      )
    }
    await client.createPrice({ ...create, productId })
  }

  for (const archive of plan.pricesToArchive) {
    await client.archivePrice(archive.priceId)
  }

  for (const archive of plan.productsToArchive) {
    await client.archiveProduct(archive.productId)
  }

  return {
    applied: {
      products: {
        created: plan.productsToCreate.length,
        archived: plan.productsToArchive.length,
      },
      prices: {
        created: plan.pricesToCreate.length,
        archived: plan.pricesToArchive.length,
      },
    },
    newProductIds,
  }
}
