import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Integration test for POST /api/checkout. Stubs the checkout client
 * via vi.mock so no live Stripe call is made; what we're testing is
 * the route's contract (validation, error mapping, success shape).
 */

const mocks = vi.hoisted(() => ({
  createCheckoutForSku: vi.fn(),
  findPriceIdByLookupKey: vi.fn(),
  createCheckoutSession: vi.fn(),
  authFn: vi.fn(),
  currentUserFn: vi.fn(),
}))

vi.mock('@contexts/billing/server', () => ({
  getStripeClient: () => ({}),
  createStripeCheckoutClient: () => ({
    findPriceIdByLookupKey: mocks.findPriceIdByLookupKey,
    createCheckoutSession: mocks.createCheckoutSession,
  }),
}))

vi.mock('@contexts/billing', () => ({
  createCheckoutForSku: mocks.createCheckoutForSku,
}))

// The route auth-gates before parsing. Default to a signed-in user
// so existing tests still exercise the validation + checkout paths;
// the 401 branch has its own dedicated test.
vi.mock('@clerk/nextjs/server', () => ({
  auth: mocks.authFn,
  currentUser: mocks.currentUserFn,
}))

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
  // Default: a Clerk-signed-in user whose verified email is known.
  mocks.authFn.mockReset()
  mocks.currentUserFn.mockReset()
  mocks.authFn.mockResolvedValue({ userId: 'user_test' })
  mocks.currentUserFn.mockResolvedValue({
    primaryEmailAddress: { emailAddress: 'buyer@example.com' },
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/checkout', () => {
  it('401s when the caller has no Clerk session (signup-first gate)', async () => {
    mocks.authFn.mockResolvedValueOnce({ userId: null })
    const res = await POST(
      makeRequest({
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
      }),
    )
    expect(res.status).toBe(401)
    const json = (await res.json()) as { error?: string }
    expect(json.error).toBe('signin_required')
    // Must NOT have attempted to open a Stripe session.
    expect(createCheckoutForSku).not.toHaveBeenCalled()
  })

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

  it('prefers the authenticated email over a body-supplied customerEmail', async () => {
    createCheckoutForSku.mockResolvedValueOnce({
      sessionId: 'cs_y',
      url: 'https://checkout.stripe.com/c/pay/cs_y',
    })
    // buyer@example.com is what the default currentUser mock returns.
    await POST(
      makeRequest({
        sku: 'recovery_kit',
        tier: 'smb',
        screenerSessionId: 'ses_1',
        customerEmail: 'spoofed@attacker.test',
      }),
    )
    // Clerk-verified email wins — the body value is ignored.
    expect(createCheckoutForSku).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'buyer@example.com' }),
      expect.anything(),
    )
  })

  it('falls back to the body-supplied customerEmail when Clerk has no email', async () => {
    mocks.currentUserFn.mockResolvedValueOnce(null)
    createCheckoutForSku.mockResolvedValueOnce({
      sessionId: 'cs_yy',
      url: 'https://checkout.stripe.com/c/pay/cs_yy',
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
