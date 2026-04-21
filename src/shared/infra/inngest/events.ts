import { eventType, staticSchema } from 'inngest'

/**
 * Typed event catalog. Per ADR 007, events are typed end-to-end so
 * publishers and workflow consumers cannot drift.
 *
 * `staticSchema<T>()` provides TypeScript types without runtime
 * validation — boundaries already validate via Zod (per ADR 009),
 * so the runtime check would be redundant.
 */

export const platformSmokeHello = eventType('platform/smoke.hello', {
  schema: staticSchema<{ data: { who: string } }>(),
})

export const caseStateTransitioned = eventType('platform/case.state.transitioned', {
  schema: staticSchema<{
    data: {
      caseId: string
      auditId: string
      kind: string
      from: string
      to: string
      actorId: string
      occurredAt: string // ISO 8601
    }
  }>(),
})

/**
 * Fired by /api/screener/complete after the lead row is written.
 * Triggers the screener-results email + downstream lifecycle cadences
 * (24h nudge, 72h nudge — tasks #29 + #30).
 */
export const screenerCompleted = eventType('platform/screener.completed', {
  schema: staticSchema<{
    data: {
      sessionId: string
      email: string
      company: string | null
      magicLink: string
    }
  }>(),
})

/**
 * Fired by the Stripe webhook handler (lands in task #33) after a
 * successful Checkout. Cancels lifecycle nudge cadences keyed on the
 * same screenerSessionId. Carries enough metadata for the case state
 * machine (task #41) to advance.
 */
export const paymentCompleted = eventType('platform/payment.completed', {
  schema: staticSchema<{
    data: {
      sessionId: string // screener session — used for cadence cancellation
      sku: string
      stripeChargeId: string
      amountUsdCents: number
      email: string
    }
  }>(),
})
