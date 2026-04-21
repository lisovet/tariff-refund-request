import { sql } from 'drizzle-orm'
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { customers } from './identity'
import { staffUsers } from './identity'
import { screenerSessions } from './screener'

/**
 * Cases + audit_log tables — the spine of the platform per PRD 04.
 *
 * cases.state mirrors the XState machine in src/contexts/ops/case-machine.ts
 * (added in task #40). State changes happen exclusively through the
 * machine; every transition appends an audit_log row + emits an Inngest
 * event.
 *
 * audit_log is append-only. RLS denies DELETE for all roles per PRD 10
 * — the deny policy is enforced in the migration (drizzle-kit emits
 * the schema; we hand-augment the migration with the RLS DDL).
 */

export const CASE_STATES = [
  'new_lead',
  'qualified',
  'disqualified',
  'awaiting_purchase',
  'awaiting_docs',
  'entry_recovery_in_progress',
  'entry_list_ready',
  'awaiting_prep_purchase',
  'cape_prep_in_progress',
  'batch_qa',
  'submission_ready',
  'concierge_active',
  'filed',
  'pending_cbp',
  'deficient',
  'paid',
  'stalled',
  'closed',
] as const

export type CaseState = (typeof CASE_STATES)[number]

export const cases = pgTable(
  'cases',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'cas_' || encode(gen_random_bytes(12), 'hex')`),
    customerId: text('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    screenerSessionId: text('screener_session_id').references(
      () => screenerSessions.id,
      { onDelete: 'set null' },
    ),
    state: text('state', { enum: CASE_STATES }).notNull().default('new_lead'),
    tier: text('tier', { enum: ['smb', 'mid_market'] }).notNull(),
    ownerStaffId: text('owner_staff_id').references(() => staffUsers.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byState: index('cases_state_idx').on(t.state),
    byOwner: index('cases_owner_idx').on(t.ownerStaffId),
    byCustomer: index('cases_customer_idx').on(t.customerId),
  }),
)

export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'aud_' || encode(gen_random_bytes(12), 'hex')`),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'restrict' }),
    actorId: text('actor_id'),
    kind: text('kind').notNull(),
    fromState: text('from_state', { enum: CASE_STATES }),
    toState: text('to_state', { enum: CASE_STATES }),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byCase: index('audit_log_case_idx').on(t.caseId, t.occurredAt),
    byKind: index('audit_log_kind_idx').on(t.kind),
  }),
)

export type CaseRow = typeof cases.$inferSelect
export type NewCaseRow = typeof cases.$inferInsert
export type AuditLogRow = typeof auditLog.$inferSelect
export type NewAuditLogRow = typeof auditLog.$inferInsert
