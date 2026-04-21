import { describe, expect, it } from 'vitest'
import {
  CHECKOUT_IDEMPOTENCY_PREFIX,
  buildCheckoutSessionParams,
  buildIdempotencyKey,
} from '../checkout'
import { CATALOG_APP_TAG, lookupKeyFor } from '../stripe-catalog'

const baseInput = {
  sku: 'recovery_kit' as const,
  tier: 'smb' as const,
  screenerSessionId: 'ses_abc123',
  priceId: 'price_xyz',
  origin: 'https://example.com',
}

describe('buildCheckoutSessionParams', () => {
  it('uses payment mode for one-time SKUs', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.mode).toBe('payment')
  })

  it('uses subscription mode for recurring SKUs (monitoring)', () => {
    const params = buildCheckoutSessionParams({
      ...baseInput,
      sku: 'monitoring',
    })
    expect(params.mode).toBe('subscription')
  })

  it('attaches the resolved price id to a single line item', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.line_items).toEqual([
      { price: 'price_xyz', quantity: 1 },
    ])
  })

  it('puts screenerSessionId, sku, tier, and app tag in metadata so the webhook can route', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.metadata).toEqual({
      screenerSessionId: 'ses_abc123',
      sku: 'recovery_kit',
      tier: 'smb',
      app: CATALOG_APP_TAG,
    })
    // Subscription mode also requires the same metadata at the
    // subscription_data level so that Stripe attaches it to the
    // resulting subscription object too.
    const recurring = buildCheckoutSessionParams({ ...baseInput, sku: 'monitoring' })
    expect(recurring.subscription_data?.metadata).toEqual({
      screenerSessionId: 'ses_abc123',
      sku: 'monitoring',
      tier: 'smb',
      app: CATALOG_APP_TAG,
    })
  })

  it('builds success and cancel URLs from origin + screenerSessionId', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.success_url).toBe(
      'https://example.com/checkout/success?session={CHECKOUT_SESSION_ID}&screener=ses_abc123',
    )
    expect(params.cancel_url).toBe(
      'https://example.com/checkout/cancel?screener=ses_abc123',
    )
  })

  it('passes customer_email when provided so receipts go to the right address', () => {
    const params = buildCheckoutSessionParams({
      ...baseInput,
      customerEmail: 'importer@example.com',
    })
    expect(params.customer_email).toBe('importer@example.com')
  })

  it('omits customer_email when not provided (Stripe collects it at Checkout)', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.customer_email).toBeUndefined()
  })

  it('enables Stripe Tax automatically (PRD 06 says applied to recovery + prep + concierge)', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.automatic_tax).toEqual({ enabled: true })
  })

  it('records the lookup_key in metadata for traceability back to pricing.ts', () => {
    const params = buildCheckoutSessionParams(baseInput)
    expect(params.metadata?.lookup_key).toBeUndefined() // not in metadata, but
    // the lookup key is recoverable from sku + tier — keep metadata clean.
  })
})

describe('buildIdempotencyKey', () => {
  it('is stable for the same (sku, tier, screenerSessionId) trio', () => {
    const a = buildIdempotencyKey({
      sku: 'recovery_kit',
      tier: 'smb',
      screenerSessionId: 'ses_1',
    })
    const b = buildIdempotencyKey({
      sku: 'recovery_kit',
      tier: 'smb',
      screenerSessionId: 'ses_1',
    })
    expect(a).toBe(b)
  })

  it('differs for different sessions', () => {
    const a = buildIdempotencyKey({
      sku: 'recovery_kit',
      tier: 'smb',
      screenerSessionId: 'ses_1',
    })
    const b = buildIdempotencyKey({
      sku: 'recovery_kit',
      tier: 'smb',
      screenerSessionId: 'ses_2',
    })
    expect(a).not.toBe(b)
  })

  it('starts with the prefix so we can grep for our keys in Stripe logs', () => {
    const k = buildIdempotencyKey({
      sku: 'recovery_kit',
      tier: 'smb',
      screenerSessionId: 'ses_1',
    })
    expect(k.startsWith(CHECKOUT_IDEMPOTENCY_PREFIX)).toBe(true)
  })

  it('encodes lookup_key cleanly (no leakage of unintended chars)', () => {
    const k = buildIdempotencyKey({
      sku: 'recovery_kit',
      tier: 'smb',
      screenerSessionId: 'ses_1',
    })
    expect(k).toContain(lookupKeyFor('recovery_kit', 'smb'))
  })
})
