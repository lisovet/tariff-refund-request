import { sql } from 'drizzle-orm'
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { cases } from './cases'

/**
 * Billing infrastructure tables.
 *
 * processed_stripe_events backs Stripe webhook idempotency per ADR
 * 005: every Stripe webhook delivery is keyed on Stripe's event id;
 * the unique constraint on event_id makes ON CONFLICT the dedupe
 * primitive — second delivery of the same event is a no-op.
 *
 * payments mirrors Stripe charges/refunds/credits + our own success-fee
 * invoices into a local ledger, idempotent on Stripe's event id. The
 * Payment aggregate (task #37) is the source of truth for case-level
 * billing math (refund clamp, success-fee remaining-headroom).
 *
 * Keeping these rows forever (no purge) is intentional.
 */

export const processedStripeEvents = pgTable('processed_stripe_events', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type ProcessedStripeEventRow = typeof processedStripeEvents.$inferSelect

export const PAYMENT_KINDS = [
  'charge',
  'refund',
  'credit',
  'success_fee_invoice',
] as const
export type PaymentKind = (typeof PAYMENT_KINDS)[number]

export const PAYMENT_STATUSES = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'voided',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const payments = pgTable(
  'payments',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'pay_' || encode(gen_random_bytes(12), 'hex')`),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'restrict' }),
    kind: text('kind', { enum: PAYMENT_KINDS }).notNull(),
    /**
     * Stripe event id that produced this row. UNIQUE so retried
     * deliveries are no-ops. NULL for our own success-fee invoice
     * inserts (we synthesize an invoice id instead).
     */
    stripeEventId: text('stripe_event_id'),
    stripeChargeId: text('stripe_charge_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    sku: text('sku'),
    /** Signed cents: positive for charges/invoices, negative for refunds/credits. */
    amountUsdCents: bigint('amount_usd_cents', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default('usd'),
    status: text('status', { enum: PAYMENT_STATUSES }).notNull(),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    eventUnique: unique('payments_stripe_event_id_unique').on(t.stripeEventId),
    byCase: index('payments_case_idx').on(t.caseId, t.occurredAt),
    byKind: index('payments_kind_idx').on(t.kind),
  }),
)

export type PaymentRow = typeof payments.$inferSelect
export type NewPaymentRow = typeof payments.$inferInsert
