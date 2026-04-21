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

/**
 * Fired by `handleSignatureCompleted` (task #73) once the Concierge
 * engagement-letter webhook confirms the customer has countersigned.
 * This is the PAYMENT GATE — the Stripe Checkout workflow wired to
 * this event is the only code path that opens Concierge checkout.
 */
export const conciergeSigned = eventType('platform/concierge.signed', {
  schema: staticSchema<{
    data: {
      caseId: string
      sku: string
      agreementId: string
      agreementVersion: number
      envelopeId: string
      signedAtIso: string
      signerEmail: string
      signerName: string
    }
  }>(),
})

/**
 * Fired by `signOffBatch` (task #65) after the case transitions to
 * `submission_ready`. Drives the artifact generation pipeline
 * (task #70): CSV + PDF rendering, R2 upload, Prep-Ready email.
 *
 * The payload embeds the full readiness report + entry rows so the
 * workflow can regenerate artifacts without a readiness-report
 * repo. Typical batches sit well under Inngest's event-size limit.
 */
export const batchSignedOff = eventType('platform/batch.signed-off', {
  schema: staticSchema<{
    data: {
      caseId: string
      batchId: string
      readinessReportId: string
      signedAtIso: string
      analystId: string
      analystName: string
      analystNote: string
      customerEmail: string
      customerName: string
      readinessReport: unknown // ReadinessReport — kept untyped here to
      // avoid a schema import cycle. The workflow handler types it.
      entries: readonly unknown[]
      caseWorkspaceUrl: string
      conciergeUpgradeUrl: string
    }
  }>(),
})
