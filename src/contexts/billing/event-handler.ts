import type Stripe from 'stripe'
import type { BillingRepo } from './repo'

/**
 * Stripe webhook event dispatcher. Pure function; takes a verified
 * Stripe event + a BillingRepo for dedupe + a publish callback for
 * downstream platform events.
 *
 * Per ADR 005:
 * - First step is always markEventProcessed (idempotency dedupe).
 * - On duplicate: return immediately, no side effects.
 * - On first-seen: dispatch by event.type. v1 only models
 *   `checkout.session.completed`; other types are silent no-ops
 *   (recorded in the dedupe table for audit).
 */

export interface PaymentCompletedPayload {
  readonly sessionId: string
  readonly sku: string
  /** Pricing tier captured in the Stripe checkout metadata. Kept as a
   *  loose string at the boundary — downstream consumers validate. */
  readonly tier: string
  readonly stripeChargeId: string
  readonly amountUsdCents: number
  readonly email: string
}

export interface HandleStripeEventInput {
  readonly event: Stripe.Event
}

export interface HandleStripeEventDeps {
  readonly repo: BillingRepo
  readonly publishPaymentCompleted: (
    payload: PaymentCompletedPayload,
  ) => Promise<void>
}

export interface HandleStripeEventResult {
  readonly status: 'processed' | 'duplicate'
}

export async function handleStripeEvent(
  input: HandleStripeEventInput,
  deps: HandleStripeEventDeps,
): Promise<HandleStripeEventResult> {
  const { event } = input

  const dedupe = await deps.repo.markEventProcessed({
    eventId: event.id,
    eventType: event.type,
  })
  if (!dedupe.firstSeen) {
    return { status: 'duplicate' }
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await onCheckoutCompleted(event, deps)
      return { status: 'processed' }
    default:
      // Unmodeled event — recorded in dedupe table; no platform event
      // published. We log but don't fail (Stripe will keep delivering).
      return { status: 'processed' }
  }
}

async function onCheckoutCompleted(
  event: Stripe.Event,
  deps: HandleStripeEventDeps,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata ?? {}
  const screenerSessionId = metadata.screenerSessionId
  if (!screenerSessionId) {
    throw new Error(
      `checkout.session.completed missing metadata.screenerSessionId on event ${event.id}`,
    )
  }
  const sku = metadata.sku ?? 'unknown'
  const tier = metadata.tier ?? 'unknown'
  const email = session.customer_email ?? ''
  const amount = session.amount_total ?? 0
  const stripeChargeId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id)

  await deps.publishPaymentCompleted({
    sessionId: screenerSessionId,
    sku,
    tier,
    stripeChargeId,
    amountUsdCents: amount,
    email,
  })
}
