import { sql } from 'drizzle-orm'
import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Screener persistence per PRD 01 + PRD 10.
 *
 * - screener_sessions: in-flight + completed sessions. Result jsonb is
 *   set when the session completes; resultVersion is denormalized for
 *   audit so we can reproduce the exact estimator output later.
 * - leads: identity captured at q10. Idempotent on (email,
 *   screenerSessionId) so duplicate completions don't create dupes.
 *
 * Retention (per PRD 10): incomplete sessions purged at 30 days,
 * leads anonymized at 12 months when no purchase follows. The purge
 * worker lands in the Phase-1 ops scaling wave; the columns +
 * timestamps land here.
 */

export const screenerSessions = pgTable('screener_sessions', {
  id: text('id')
    .primaryKey()
    .default(sql`'sess_' || encode(gen_random_bytes(16), 'hex')`),
  startedAt: timestamp('started_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  answers: jsonb('answers').notNull().default({}),
  result: jsonb('result'),
  resultVersion: text('result_version'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const leads = pgTable(
  'leads',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'lead_' || encode(gen_random_bytes(12), 'hex')`),
    email: text('email').notNull(),
    company: text('company'),
    screenerSessionId: text('screener_session_id').references(
      () => screenerSessions.id,
      { onDelete: 'set null' },
    ),
    source: text('source').notNull().default('screener'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('leads_email_session_idx').on(t.email, t.screenerSessionId),
  ],
)

export type ScreenerSessionRow = typeof screenerSessions.$inferSelect
export type LeadRow = typeof leads.$inferSelect
