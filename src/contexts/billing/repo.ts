/**
 * Billing repo contract — currently scoped to Stripe webhook
 * idempotency dedupe. Per ADR 005: every Stripe webhook is keyed on
 * Stripe's event id; a unique constraint on event_id makes ON
 * CONFLICT the dedupe primitive.
 */

export interface MarkEventInput {
  readonly eventId: string
  readonly eventType: string
}

export interface MarkEventResult {
  /**
   * True if this is the first time we've seen the event. False if
   * the event id was already recorded — caller should skip
   * processing.
   */
  readonly firstSeen: boolean
}

export interface BillingRepo {
  markEventProcessed(input: MarkEventInput): Promise<MarkEventResult>
}
