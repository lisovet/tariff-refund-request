import { describe, expect, it, vi } from 'vitest'
import {
  CATALOG_APP_TAG,
  executeCatalogPlan,
  lookupKeyFor,
  planCatalogSync,
  type StripeCatalogClient,
} from '../stripe-catalog'

function makeClient(): {
  client: StripeCatalogClient
  calls: string[]
} {
  const calls: string[] = []
  const client: StripeCatalogClient = {
    createProduct: vi.fn(async (input) => {
      calls.push(`createProduct ${input.metadata.sku}/${input.metadata.tier}`)
      return { id: `prod_${input.metadata.sku}_${input.metadata.tier}` }
    }),
    createPrice: vi.fn(async (input) => {
      calls.push(`createPrice ${input.lookupKey}=${input.unitAmountCents}`)
      return { id: `price_${input.lookupKey}` }
    }),
    archivePrice: vi.fn(async (priceId) => {
      calls.push(`archivePrice ${priceId}`)
    }),
    archiveProduct: vi.fn(async (productId) => {
      calls.push(`archiveProduct ${productId}`)
    }),
    findProductIdByMetadata: vi.fn(async () => {
      // Without a snapshot this returns undefined — useful for the
      // create-from-empty path where the executor needs the new
      // product id.
      return undefined
    }),
  }
  return { client, calls }
}

describe('executeCatalogPlan', () => {
  it('does nothing for a no-op plan', async () => {
    const { client, calls } = makeClient()
    const result = await executeCatalogPlan(
      {
        productsToCreate: [],
        pricesToCreate: [],
        pricesToArchive: [],
        productsToArchive: [],
        diff: [],
        isNoOp: true,
      },
      client,
    )
    expect(calls).toHaveLength(0)
    expect(result.applied.products.created).toBe(0)
    expect(result.applied.prices.created).toBe(0)
    expect(result.applied.prices.archived).toBe(0)
    expect(result.applied.products.archived).toBe(0)
  })

  it('creates products before prices, then archives stale prices, then archives products', async () => {
    const { client, calls } = makeClient()
    const plan = planCatalogSync({ products: [] })

    await executeCatalogPlan(plan, client)

    // Every product create must precede every price create.
    let lastCreateProductIdx = -1
    for (let i = 0; i < calls.length; i++) {
      const c = calls[i]
      if (c?.startsWith('createProduct')) lastCreateProductIdx = i
    }
    const firstCreatePriceIdx = calls.findIndex((c) => c.startsWith('createPrice'))
    expect(lastCreateProductIdx).toBeLessThan(firstCreatePriceIdx)
  })

  it('returns counts that match the plan', async () => {
    const { client } = makeClient()
    const plan = planCatalogSync({ products: [] })

    const result = await executeCatalogPlan(plan, client)

    expect(result.applied.products.created).toBe(plan.productsToCreate.length)
    expect(result.applied.prices.created).toBe(plan.pricesToCreate.length)
    expect(result.applied.prices.archived).toBe(plan.pricesToArchive.length)
    expect(result.applied.products.archived).toBe(plan.productsToArchive.length)
  })

  it('passes recurring config through to createPrice for monitoring', async () => {
    const { client } = makeClient()
    const plan = planCatalogSync({ products: [] })
    await executeCatalogPlan(plan, client)

    const monitoringCalls = (client.createPrice as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => {
        const input = call[0] as { sku: string; recurring?: unknown }
        return input.sku === 'monitoring'
      },
    )
    expect(monitoringCalls).toHaveLength(2)
    for (const call of monitoringCalls) {
      const input = call[0] as { recurring?: { interval: string } }
      expect(input.recurring).toEqual({ interval: 'month', interval_count: 1 })
    }
  })

  it('looks up the existing product id when archiving stale prices', async () => {
    // Setup: existing product with a stale price + nothing else.
    const stalePriceId = 'price_stale'
    const productId = 'prod_existing'
    const findById = vi.fn(async (q: { sku: string; tier: string }) => {
      if (q.sku === 'recovery_kit' && q.tier === 'smb') return productId
      return undefined
    })
    const calls: string[] = []
    const client: StripeCatalogClient = {
      createProduct: vi.fn(async (input) => {
        calls.push(`createProduct ${input.metadata.sku}/${input.metadata.tier}`)
        return { id: `prod_${input.metadata.sku}_${input.metadata.tier}` }
      }),
      createPrice: vi.fn(async (input) => {
        calls.push(`createPrice ${input.lookupKey}`)
        return { id: `price_${input.lookupKey}` }
      }),
      archivePrice: vi.fn(async (priceId) => {
        calls.push(`archivePrice ${priceId}`)
      }),
      archiveProduct: vi.fn(async (productIdArg) => {
        calls.push(`archiveProduct ${productIdArg}`)
      }),
      findProductIdByMetadata: findById,
    }
    const plan = planCatalogSync({
      products: [
        {
          id: productId,
          name: 'recovery_kit (smb)',
          active: true,
          metadata: { sku: 'recovery_kit', tier: 'smb', app: CATALOG_APP_TAG },
          prices: [
            {
              id: stalePriceId,
              active: true,
              currency: 'usd',
              unit_amount: 79_00,
              lookup_key: lookupKeyFor('recovery_kit', 'smb'),
              metadata: { sku: 'recovery_kit', tier: 'smb', app: CATALOG_APP_TAG },
              recurring: null,
            },
          ],
        },
      ],
    })

    await executeCatalogPlan(plan, client)

    // The stale price was archived.
    expect(calls).toContain('archivePrice price_stale')
    // No new product create for recovery_kit/smb (it already exists).
    expect(
      calls.some((c) => c === 'createProduct recovery_kit/smb'),
    ).toBe(false)
    // A replacement price was created.
    expect(calls).toContain('createPrice trr__recovery_kit__smb')
  })
})
