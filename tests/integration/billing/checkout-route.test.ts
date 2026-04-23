import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as BillingModule from '@contexts/billing'

/**
 * Integration test for POST /api/checkout. Stubs the checkout client
 * via vi.mock so no live Stripe call is made; what we're testing is
 * the route's contract (validation, error mapping, success shape).
 */

const mocks = vi.hoisted(() => ({
  createCheckoutForSku: vi.fn(),
  findPriceIdByLookupKey: vi.fn(),
  createCheckoutSession: vi.fn(),
}))

vi.mock('@contexts/billing/server', () => ({
  getStripeClient: () => ({}),
  createStripeCheckoutClient: () => ({
    findPriceIdByLookupKey: mocks.findPriceIdByLookupKey,
    createCheckoutSession: mocks.createCheckoutSession,
  }),
}))

vi.mock('@contexts/billing', async (importOriginal) => {
  const actual = await importOriginal<typeof BillingModule>()
  return {
    ...actual,
    createCheckoutForSku: mocks.createCheckoutForSku,
  }
})

const { createCheckoutForSku, findPriceIdByLookupKey, createCheckoutSession } = mocks

import { POST } from '@/app/api/checkout/route'

function makeRequest(body: unknown, origin = 'https://example.com'): Request {
  return new Request(`${origin}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  createCheckoutForSku.mockReset()
  findPriceIdByLookupKey.mockReset()
  createCheckoutSession.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/checkout', () => {
  it('400s on a missing sku/tier/sessionId', async () => {
    const res = await POST(makeRequest({ sku: 'recovery_kit' }))
    expect(res.status).toBe(400)
  })

  it('400s on an unknown sku', async () => {
    const res = await POST(
      makeRequest({
        sku: 'totally_made_up',
        tier: 'smb',
        screenerSessionId: 'ses_1',
      }),
    )
    expect(res.status).toBe(400)
  })

  it.each([
    'recovery_service',
    'cape_prep_standard',
    'cape_prep_premium',
    'monitoring',
  ] as const)(
    '400s on SKU %s — not reachable from the two-tier checkout',
    async (sku) => {
      const res = await POST(
        makeRequest({ sku, tier: 'smb', screenerSessionId: 'ses_1' }),
      )
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error: string; sku?: string }
      expect(body.error).toBe('sku_not_available')
      expect(body.sku).toBe(sku)
      expect(createCheckoutForSku).not.toHaveBeenCalled()
    },
  )

  it('returns the Stripe Checkout url on success', async () => {
    createCheckoutForSku.mockResolvedValueOnce({
      sessionId: 'cs_999',
      url: 'https://checkout.stripe.com/c/pay/cs_999',
    })
    const res = await POST(
      makeRequest({
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
      }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { url: string; sessionId: string }
    expect(json.url).toBe('https://checkout.stripe.com/c/pay/cs_999')
    expect(json.sessionId).toBe('cs_999')
  })

  it('502s when Stripe returns no url (Checkout misconfigured)', async () => {
    createCheckoutForSku.mockResolvedValueOnce({ sessionId: 'cs_x', url: null })
    const res = await POST(
      makeRequest({
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
      }),
    )
    expect(res.status).toBe(502)
  })

  it('500s when the catalog has no matching price', async () => {
    createCheckoutForSku.mockRejectedValueOnce(
      new Error('no Stripe price for trr__recovery_kit__smb'),
    )
    const res = await POST(
      makeRequest({
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
      }),
    )
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('checkout_failed')
  })

  it('passes the customer email through when supplied', async () => {
    createCheckoutForSku.mockResolvedValueOnce({
      sessionId: 'cs_y',
      url: 'https://checkout.stripe.com/c/pay/cs_y',
    })
    await POST(
      makeRequest({
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
        customerEmail: 'importer@example.com',
      }),
    )
    expect(createCheckoutForSku).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'importer@example.com' }),
      expect.anything(),
    )
  })

  it('uses the request origin when building Checkout URLs', async () => {
    createCheckoutForSku.mockResolvedValueOnce({
      sessionId: 'cs_z',
      url: 'https://checkout.stripe.com/c/pay/cs_z',
    })
    await POST(
      makeRequest(
        {
          sku: 'recovery_kit',
          tier: 'smb',
          screenerSessionId: 'ses_1',
        },
        'https://staging.example.com',
      ),
    )
    expect(createCheckoutForSku).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'https://staging.example.com' }),
      expect.anything(),
    )
  })
})
