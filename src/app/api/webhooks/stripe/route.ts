import { NextResponse } from 'next/server'
import {
  getBillingRepo,
  getStripeClient,
} from '@contexts/billing/server'
import { handleStripeEvent } from '@contexts/billing'
import { inngest } from '@shared/infra/inngest/client'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * POST /api/webhooks/stripe
 *
 * Verifies the Stripe-Signature header against STRIPE_WEBHOOK_SECRET,
 * then delegates to the idempotent event handler. Per ADR 005:
 *
 *   - Same Stripe event id replayed → returns 200 + status:'duplicate'.
 *   - Each event is recorded in processed_stripe_events for audit.
 *   - On checkout.session.completed → publishes
 *     platform/payment.completed to Inngest, which the lifecycle
 *     nudge cadence (#29) listens for to cancel itself.
 *
 * In dev/tests the route still requires STRIPE_WEBHOOK_SECRET — the
 * Stripe CLI's `stripe listen` workflow provisions one locally.
 */

export async function POST(req: Request): Promise<Response> {
  const log = getLogger()
  const tracker = getErrorTracker()

  const signature = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature) {
    return NextResponse.json(
      { error: 'missing_stripe_signature' },
      { status: 400 },
    )
  }

  if (!secret) {
    log.error('stripe webhook misconfigured: STRIPE_WEBHOOK_SECRET missing')
    return NextResponse.json(
      { error: 'server_misconfigured' },
      { status: 500 },
    )
  }

  const body = await req.text()
  const stripe = getStripeClient()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret)
  } catch (err) {
    log.warn('stripe webhook signature verification failed')
    tracker.captureException(err, { route: '/api/webhooks/stripe' })
    return NextResponse.json(
      { error: 'signature_mismatch' },
      { status: 401 },
    )
  }

  try {
    const result = await handleStripeEvent(
      { event },
      {
        repo: getBillingRepo(),
        publishPaymentCompleted: async (payload) => {
          await inngest.send({
            name: 'platform/payment.completed',
            data: payload,
          })
        },
      },
    )
    log.info('stripe webhook handled', {
      eventId: event.id,
      type: event.type,
      status: result.status,
    })
    return NextResponse.json({ ok: true, status: result.status })
  } catch (err) {
    log.error('stripe webhook handler failed', {
      eventId: event.id,
      type: event.type,
      error: String(err),
    })
    tracker.captureException(err, { route: '/api/webhooks/stripe', eventId: event.id })
    return NextResponse.json({ error: 'handler_error' }, { status: 500 })
  }
}
