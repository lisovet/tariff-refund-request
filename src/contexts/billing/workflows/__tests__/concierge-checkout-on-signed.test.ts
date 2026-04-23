import { describe, expect, it, vi } from 'vitest'
import {
  conciergeCheckoutOnSignedHandler,
  type ConciergeCheckoutOnSignedInput,
} from '../concierge-checkout-on-signed'
import type { CheckoutClient } from '../../checkout'

function makeStep(): ConciergeCheckoutOnSignedInput['step'] {
  return {
    async run<T>(_name: string, fn: () => T | Promise<T>): Promise<T> {
      return fn()
    },
  }
}

function makeCheckoutClient(): {
  client: CheckoutClient
  findPriceIdByLookupKey: ReturnType<typeof vi.fn>
  createCheckoutSession: ReturnType<typeof vi.fn>
} {
  const findPriceIdByLookupKey = vi.fn(async (_key: string) => 'price_123')
  const createCheckoutSession = vi.fn(async () => ({
    id: 'cs_test_xyz',
    url: 'https://checkout.stripe.test/session/cs_test_xyz',
  }))
  return {
    client: { findPriceIdByLookupKey, createCheckoutSession },
    findPriceIdByLookupKey,
    createCheckoutSession,
  }
}

const BASE_EVENT: ConciergeCheckoutOnSignedInput['event'] = {
  data: {
    caseId: 'cas_c2',
    sku: 'full-prep',
    agreementId: 'full-prep-v1',
    agreementVersion: 1,
    envelopeId: 'env_xyz',
    signedAtIso: '2026-04-21T14:00:00.000Z',
    signerEmail: 'controller@acme.test',
    signerName: 'Dana Finance',
  },
}

describe('conciergeCheckoutOnSignedHandler', () => {
  it('opens Stripe Checkout after the signature event', async () => {
    const { client, findPriceIdByLookupKey, createCheckoutSession } = makeCheckoutClient()
    const result = await conciergeCheckoutOnSignedHandler(
      { event: BASE_EVENT, step: makeStep() },
      { checkoutClient: client, appOrigin: 'https://app.example.com', tier: 'smb' },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.checkoutSessionId).toBe('cs_test_xyz')
    expect(result.checkoutUrl).toBe('https://checkout.stripe.test/session/cs_test_xyz')
    expect(findPriceIdByLookupKey).toHaveBeenCalledTimes(1)
    expect(createCheckoutSession).toHaveBeenCalledTimes(1)
    const [params, opts] = createCheckoutSession.mock.calls[0] ?? []
    expect(opts?.idempotencyKey).toContain('env_xyz') // envelope id scopes idempotency
    expect(params?.customer_email).toBe('controller@acme.test')
  })

  it('refuses non-full-prep SKUs (defense in depth — event filter should prevent this)', async () => {
    const { client } = makeCheckoutClient()
    const result = await conciergeCheckoutOnSignedHandler(
      {
        event: {
          ...BASE_EVENT,
          data: { ...BASE_EVENT.data, sku: 'audit' },
        },
        step: makeStep(),
      },
      { checkoutClient: client, appOrigin: 'https://app.example.com', tier: 'smb' },
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('sku_not_concierge')
  })

  it('envelope id is the idempotency scope — same envelope produces the same key on retry', async () => {
    const { client, createCheckoutSession } = makeCheckoutClient()
    const args = [
      { event: BASE_EVENT, step: makeStep() },
      {
        checkoutClient: client,
        appOrigin: 'https://app.example.com',
        tier: 'smb' as const,
      },
    ] as const
    await conciergeCheckoutOnSignedHandler(args[0], args[1])
    await conciergeCheckoutOnSignedHandler(args[0], args[1])
    // Both invocations should produce the same idempotency key, so
    // the underlying Stripe call would dedupe server-side.
    const [firstOpts] = createCheckoutSession.mock.calls[0]?.slice(1) ?? []
    const [secondOpts] = createCheckoutSession.mock.calls[1]?.slice(1) ?? []
    expect(firstOpts?.idempotencyKey).toBe(secondOpts?.idempotencyKey)
  })
})
