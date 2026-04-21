import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createCheckoutForSku } from '@contexts/billing'
import {
  createStripeCheckoutClient,
  getStripeClient,
} from '@contexts/billing/server'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * POST /api/checkout
 *
 * Body: { sku, tier, screenerSessionId, customerEmail? }
 *
 * Opens a Stripe Checkout Session for the requested (sku, tier)
 * combo, scoped to a screener session for idempotency. The price is
 * resolved by `lookup_key` from the catalog sync (`npm run stripe:sync`)
 * — callers never hardcode price IDs.
 *
 * Webhook (POST /api/webhooks/stripe) reads the screenerSessionId out
 * of metadata.* on `checkout.session.completed` and publishes
 * platform/payment.completed for downstream lifecycle workflows.
 */

const SKUS = [
  'recovery_kit',
  'recovery_service',
  'cape_prep_standard',
  'cape_prep_premium',
  'concierge_base',
  'monitoring',
] as const

const TIERS = ['smb', 'mid_market'] as const

const BodySchema = z.object({
  sku: z.enum(SKUS),
  tier: z.enum(TIERS),
  screenerSessionId: z.string().min(1),
  customerEmail: z.string().email().optional(),
})

export async function POST(req: Request): Promise<Response> {
  const log = getLogger()
  const tracker = getErrorTracker()

  let parsed: z.infer<typeof BodySchema>
  try {
    parsed = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: String(err) },
      { status: 400 },
    )
  }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin

  try {
    const result = await createCheckoutForSku(
      {
        sku: parsed.sku,
        tier: parsed.tier,
        screenerSessionId: parsed.screenerSessionId,
        origin,
        customerEmail: parsed.customerEmail,
      },
      createStripeCheckoutClient(getStripeClient()),
    )

    if (!result.url) {
      log.error('checkout.create returned no url', {
        sessionId: result.sessionId,
        sku: parsed.sku,
      })
      return NextResponse.json(
        { error: 'checkout_misconfigured' },
        { status: 502 },
      )
    }

    log.info('checkout.create ok', {
      sessionId: result.sessionId,
      sku: parsed.sku,
      tier: parsed.tier,
      screenerSessionId: parsed.screenerSessionId,
    })
    return NextResponse.json({ sessionId: result.sessionId, url: result.url })
  } catch (err) {
    log.error('checkout.create failed', {
      error: String(err),
      sku: parsed.sku,
      tier: parsed.tier,
    })
    tracker.captureException(err, { route: '/api/checkout' })
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }
}
