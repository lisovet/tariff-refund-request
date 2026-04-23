import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import {
  CUSTOMER_FACING_SKUS,
  createCheckoutForSku,
  isCustomerFacingSku,
} from '@contexts/billing'
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

  // Auth gate: sign-up-first identity contract from the remediation
  // plan. An unauthenticated Buy click returns 401 so the client
  // component can redirect the user through /sign-up before we ever
  // open a Stripe session. This keeps the Buy button itself free of
  // Clerk hooks — critical because the button renders on the
  // (marketing) layout, which does not mount a ClerkProvider.
  const session = await auth()
  if (!session.userId) {
    return NextResponse.json({ error: 'signin_required' }, { status: 401 })
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    parsed = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: String(err) },
      { status: 400 },
    )
  }

  // Two-tier gate: only SKUs mapped to a customer-facing Tier are
  // reachable from this route. The four middle-ladder SKUs
  // (recovery_service, cape_prep_*, monitoring) remain price-defined
  // and in the Stripe catalog but are ops-only.
  if (!isCustomerFacingSku(parsed.sku)) {
    log.warn('checkout.create rejected non-customer-facing sku', {
      sku: parsed.sku,
      allowed: CUSTOMER_FACING_SKUS,
    })
    return NextResponse.json(
      { error: 'sku_not_available', sku: parsed.sku },
      { status: 400 },
    )
  }

  // Pull the authenticated buyer's email so the post-payment workflow
  // can resolve their customer row reliably.
  const user = await currentUser()
  const authedEmail = user?.primaryEmailAddress?.emailAddress

  const origin = req.headers.get('origin') ?? new URL(req.url).origin

  try {
    const result = await createCheckoutForSku(
      {
        sku: parsed.sku,
        tier: parsed.tier,
        screenerSessionId: parsed.screenerSessionId,
        origin,
        // Prefer the authenticated user's email — it's the one that
        // was verified at Clerk sign-up and that the customers row
        // was upserted against. Falls back to a caller-supplied value
        // only when auth() returned no email (rare).
        customerEmail: authedEmail ?? parsed.customerEmail,
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
