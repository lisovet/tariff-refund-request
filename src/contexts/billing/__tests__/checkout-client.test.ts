import { describe, expect, it, vi } from 'vitest'
import { createCheckoutForSku, type CheckoutClient } from '../checkout'
import { lookupKeyFor } from '../stripe-catalog'

function makeClient(overrides: Partial<CheckoutClient> = {}): {
  client: CheckoutClient
  calls: string[]
} {
  const calls: string[] = []
  const client: CheckoutClient = {
    findPriceIdByLookupKey: vi.fn(async (lookupKey: string) => {
      calls.push(`findPriceIdByLookupKey ${lookupKey}`)
      return 'price_resolved'
    }),
    createCheckoutSession: vi.fn(async (params, opts) => {
      calls.push(`createCheckoutSession mode=${params.mode} idem=${opts.idempotencyKey}`)
      return { id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' }
    }),
    ...overrides,
  }
  return { client, calls }
}

describe('createCheckoutForSku', () => {
  it('resolves the price by lookup_key, then opens Checkout with idempotency', async () => {
    const { client, calls } = makeClient()
    const result = await createCheckoutForSku(
      {
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
        origin: 'https://example.com',
      },
      client,
    )
    expect(result).toEqual({
      sessionId: 'cs_123',
      url: 'https://checkout.stripe.com/c/pay/cs_123',
    })
    expect(calls[0]).toBe(
      `findPriceIdByLookupKey ${lookupKeyFor('recovery_kit', 'smb')}`,
    )
    expect(calls[1]).toMatch(/^createCheckoutSession mode=payment idem=trr_checkout__trr__recovery_kit__smb__ses_1$/)
  })

  it('uses subscription mode for monitoring', async () => {
    const { client, calls } = makeClient()
    await createCheckoutForSku(
      {
        sku: 'monitoring',
        tier: 'mid_market',
        screenerSessionId: 'ses_2',
        origin: 'https://example.com',
      },
      client,
    )
    expect(calls[1]).toContain('mode=subscription')
  })

  it('throws a clear error when the price is missing in Stripe (catalog not synced)', async () => {
    const { client } = makeClient({
      findPriceIdByLookupKey: vi.fn(async () => undefined),
    })
    await expect(
      createCheckoutForSku(
        {
          sku: 'recovery_kit',
          tier: 'smb',
          screenerSessionId: 'ses_1',
          origin: 'https://example.com',
        },
        client,
      ),
    ).rejects.toThrow(/no Stripe price for trr__recovery_kit__smb/i)
  })

  it('passes customer_email through when supplied', async () => {
    const create = vi.fn(async () => ({
      id: 'cs_x',
      url: 'https://checkout.stripe.com/c/pay/cs_x',
    }))
    const client: CheckoutClient = {
      findPriceIdByLookupKey: vi.fn(async () => 'price_x'),
      createCheckoutSession: create,
    }
    await createCheckoutForSku(
      {
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
        origin: 'https://example.com',
        customerEmail: 'importer@example.com',
      },
      client,
    )
    const firstCall = create.mock.calls[0] as unknown[] | undefined
    const params = (firstCall?.[0] ?? {}) as { customer_email?: string }
    expect(params.customer_email).toBe('importer@example.com')
  })
})
