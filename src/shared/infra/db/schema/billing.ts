import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Billing infrastructure tables.
 *
 * processed_stripe_events backs Stripe webhook idempotency per ADR
 * 005: every Stripe webhook delivery is keyed on Stripe's event id;
 * the unique constraint on event_id makes ON CONFLICT the dedupe
 * primitive — second delivery of the same event is a no-op.
 *
 * Keeping the row forever (no purge) is intentional — Stripe never
 * re-uses an event id, and the table grows slowly enough that the
 * audit trail outweighs the storage cost.
 */

export const processedStripeEvents = pgTable('processed_stripe_events', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type ProcessedStripeEventRow = typeof processedStripeEvents.$inferSelect
