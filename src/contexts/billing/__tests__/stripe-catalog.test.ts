import { describe, expect, it } from 'vitest'
import {
  CATALOG_APP_TAG,
  SKU_RECURRENCE,
  lookupKeyFor,
  planCatalogSync,
  type StripeCatalogSnapshot,
  type StripeProductSnapshot,
} from '../stripe-catalog'

const empty: StripeCatalogSnapshot = { products: [] }

function product(
  partial: Partial<StripeProductSnapshot> & {
    sku: string
    tier: string
    prices?: StripeProductSnapshot['prices']
  },
): StripeProductSnapshot {
  return {
    id: `prod_${partial.sku}_${partial.tier}`,
    name: `${partial.sku} (${partial.tier})`,
    active: true,
    metadata: {
      sku: partial.sku,
      tier: partial.tier,
      app: CATALOG_APP_TAG,
    },
    prices: partial.prices ?? [],
  }
}

describe('lookupKeyFor', () => {
  it('produces a stable, namespaced lookup key', () => {
    expect(lookupKeyFor('recovery_kit', 'smb')).toBe('trr__recovery_kit__smb')
    expect(lookupKeyFor('monitoring', 'mid_market')).toBe('trr__monitoring__mid_market')
  })
})

describe('planCatalogSync — first run on empty Stripe', () => {
  it('plans every (sku, tier) as a product+price create, no archives', () => {
    const plan = planCatalogSync(empty)

    // 6 SKUs × 2 tiers = 12 product/price pairs.
    expect(plan.productsToCreate).toHaveLength(12)
    expect(plan.pricesToCreate).toHaveLength(12)
    expect(plan.pricesToArchive).toHaveLength(0)
    expect(plan.productsToArchive).toHaveLength(0)
    expect(plan.isNoOp).toBe(false)
  })

  it('tags every planned product with the app metadata', () => {
    const plan = planCatalogSync(empty)
    for (const create of plan.productsToCreate) {
      expect(create.metadata.app).toBe(CATALOG_APP_TAG)
      expect(create.metadata.sku).toBeDefined()
      expect(create.metadata.tier).toBeDefined()
    }
  })

  it('uses recurring config for monitoring, one-time for everything else', () => {
    const plan = planCatalogSync(empty)
    const monitoring = plan.pricesToCreate.filter((p) => p.sku === 'monitoring')
    expect(monitoring).toHaveLength(2)
    for (const p of monitoring) {
      expect(p.recurring).toEqual({ interval: 'month', interval_count: 1 })
    }
    const recoveryKit = plan.pricesToCreate.filter((p) => p.sku === 'recovery_kit')
    expect(recoveryKit).toHaveLength(2)
    for (const p of recoveryKit) {
      expect(p.recurring).toBeUndefined()
    }
  })

  it('SKU_RECURRENCE covers every sku', () => {
    const skus = [
      'recovery_kit',
      'recovery_service',
      'cape_prep_standard',
      'cape_prep_premium',
      'concierge_base',
      'monitoring',
    ] as const
    for (const sku of skus) {
      expect(SKU_RECURRENCE[sku]).toBeDefined()
    }
  })
})

describe('planCatalogSync — second run is a no-op', () => {
  it('returns isNoOp=true when every (sku, tier) has a matching active price', () => {
    const planFresh = planCatalogSync(empty)
    // Build a snapshot that reflects what Stripe would look like after
    // executing the fresh plan.
    const snapshot: StripeCatalogSnapshot = {
      products: planFresh.productsToCreate.map((create) => {
        const matchingPrice = planFresh.pricesToCreate.find(
          (p) => p.sku === create.metadata.sku && p.tier === create.metadata.tier,
        )!
        return product({
          sku: create.metadata.sku,
          tier: create.metadata.tier,
          prices: [
            {
              id: `price_${create.metadata.sku}_${create.metadata.tier}`,
              active: true,
              currency: 'usd',
              unit_amount: matchingPrice.unitAmountCents,
              lookup_key: lookupKeyFor(
                create.metadata.sku as never,
                create.metadata.tier as never,
              ),
              metadata: {
                sku: create.metadata.sku,
                tier: create.metadata.tier,
                app: CATALOG_APP_TAG,
              },
              recurring: matchingPrice.recurring ?? null,
            },
          ],
        })
      }),
    }

    const replan = planCatalogSync(snapshot)
    expect(replan.productsToCreate).toHaveLength(0)
    expect(replan.pricesToCreate).toHaveLength(0)
    expect(replan.pricesToArchive).toHaveLength(0)
    expect(replan.productsToArchive).toHaveLength(0)
    expect(replan.isNoOp).toBe(true)
  })
})

describe('planCatalogSync — price drift', () => {
  it('archives the stale price + creates a new one when amount changed', () => {
    const stale = product({
      sku: 'recovery_kit',
      tier: 'smb',
      prices: [
        {
          id: 'price_old',
          active: true,
          currency: 'usd',
          unit_amount: 79_00, // ladder is 99_00 — drift.
          lookup_key: lookupKeyFor('recovery_kit', 'smb'),
          metadata: { sku: 'recovery_kit', tier: 'smb', app: CATALOG_APP_TAG },
          recurring: null,
        },
      ],
    })
    const plan = planCatalogSync({ products: [stale] })

    expect(plan.pricesToArchive).toContainEqual(
      expect.objectContaining({ priceId: 'price_old', reason: 'amount_drift' }),
    )
    expect(plan.pricesToCreate).toContainEqual(
      expect.objectContaining({
        sku: 'recovery_kit',
        tier: 'smb',
        unitAmountCents: 99_00,
      }),
    )
    // Product itself stays.
    expect(plan.productsToCreate).not.toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ sku: 'recovery_kit', tier: 'smb' }),
      }),
    )
  })

  it('archives extra active prices that do not match the ladder', () => {
    const noisy = product({
      sku: 'recovery_kit',
      tier: 'smb',
      prices: [
        {
          id: 'price_correct',
          active: true,
          currency: 'usd',
          unit_amount: 99_00,
          lookup_key: lookupKeyFor('recovery_kit', 'smb'),
          metadata: { sku: 'recovery_kit', tier: 'smb', app: CATALOG_APP_TAG },
          recurring: null,
        },
        {
          id: 'price_extra',
          active: true,
          currency: 'usd',
          unit_amount: 49_00,
          lookup_key: 'legacy_promo',
          metadata: { sku: 'recovery_kit', tier: 'smb', app: CATALOG_APP_TAG },
          recurring: null,
        },
      ],
    })
    const plan = planCatalogSync({ products: [noisy] })

    expect(plan.pricesToArchive).toContainEqual(
      expect.objectContaining({ priceId: 'price_extra' }),
    )
    expect(plan.pricesToCreate).toHaveLength(11) // all the others.
  })
})

describe('planCatalogSync — obsolete products', () => {
  it('archives products tagged with our app but no longer in the ladder', () => {
    const obsolete: StripeProductSnapshot = {
      id: 'prod_obsolete',
      name: 'sunset_offering (smb)',
      active: true,
      metadata: { sku: 'sunset_offering', tier: 'smb', app: CATALOG_APP_TAG },
      prices: [],
    }
    const plan = planCatalogSync({ products: [obsolete] })

    expect(plan.productsToArchive).toContainEqual(
      expect.objectContaining({ productId: 'prod_obsolete', reason: 'sku_removed' }),
    )
  })

  it('ignores products without our app tag (other apps share Stripe accounts)', () => {
    const foreign: StripeProductSnapshot = {
      id: 'prod_other_app',
      name: 'other thing',
      active: true,
      metadata: { sku: 'other', tier: 'whatever', app: 'some_other_app' },
      prices: [],
    }
    const plan = planCatalogSync({ products: [foreign] })

    expect(plan.productsToArchive).not.toContainEqual(
      expect.objectContaining({ productId: 'prod_other_app' }),
    )
  })

  it('does not re-archive an already-inactive product', () => {
    const alreadyArchived: StripeProductSnapshot = {
      id: 'prod_done',
      name: 'sunset (smb)',
      active: false,
      metadata: { sku: 'sunset', tier: 'smb', app: CATALOG_APP_TAG },
      prices: [],
    }
    const plan = planCatalogSync({ products: [alreadyArchived] })

    expect(plan.productsToArchive).not.toContainEqual(
      expect.objectContaining({ productId: 'prod_done' }),
    )
  })
})

describe('planCatalogSync — diff log shape', () => {
  it('every entry on every plan list is human-readable', () => {
    const plan = planCatalogSync(empty)
    for (const entry of plan.diff) {
      expect(typeof entry).toBe('string')
      expect(entry.length).toBeGreaterThan(0)
    }
    // 12 creates × (product + price) lines = 24.
    expect(plan.diff.length).toBe(24)
  })
})
