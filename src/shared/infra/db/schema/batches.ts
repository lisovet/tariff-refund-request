import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { cases } from './cases'
import { entries } from './entries'

/**
 * batches + batch_entries per PRD 03.
 *
 * A batch is a group of entries the customer (or analyst) ships
 * together as a single CAPE submission. The link table preserves
 * the ordered membership so the CSV builder can render entries in
 * the order the analyst arranged them.
 *
 * status values mirror BATCH_STATUSES in @contexts/cape/schema.ts;
 * the schema uses `text` rather than `pgEnum` so the v1 migration
 * stays additive (adding a status later is one column-comment
 * change, not a type-level migration).
 */

export const BATCH_STATUSES_DB = [
  'draft',
  'validated',
  'qa_pending',
  'ready',
  'submitted',
] as const

export const batches = pgTable(
  'batches',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'bat_' || encode(gen_random_bytes(12), 'hex')`),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'restrict' }),
    label: text('label').notNull(),
    phaseFlag: text('phase_flag').notNull(),
    status: text('status', { enum: BATCH_STATUSES_DB }).notNull().default('draft'),
    /** id of the validation run that produced this batch (FK lands when the runs table does). */
    validationRunId: text('validation_run_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byCase: index('batches_case_idx').on(t.caseId, t.createdAt),
    byStatus: index('batches_status_idx').on(t.status),
  }),
)

export const batchEntries = pgTable(
  'batch_entries',
  {
    batchId: text('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'restrict' }),
    /** 1-indexed position inside the batch (preserves analyst ordering). */
    position: integer('position').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.batchId, t.entryId] }),
    byBatch: index('batch_entries_batch_idx').on(t.batchId, t.position),
    byEntry: index('batch_entries_entry_idx').on(t.entryId),
  }),
)

export type BatchRow = typeof batches.$inferSelect
export type NewBatchRow = typeof batches.$inferInsert
export type BatchEntryRow = typeof batchEntries.$inferSelect
export type NewBatchEntryRow = typeof batchEntries.$inferInsert
