import { sql } from 'drizzle-orm'
import {
  bigint,
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { cases } from './cases'
import { recoverySources, RECOVERY_SOURCE_CONFIDENCES } from './documents'

/**
 * entries — canonical EntryRecord per PRD 07. UNIQUE (case_id,
 * entry_number) keeps a case's entry list free of duplicates; ingest
 * dedupe relies on this.
 *
 * entry_source_records — provenance per the .ralph/PROMPT.md hard
 * rule. Every entry MUST reference at least one source. Multiple
 * sources for the same entry are allowed and strengthen confidence
 * (PRD 07 acceptance: "the second source is attached to the existing
 * entry as an additional EntrySourceRecord and the confidence is
 * upgraded").
 */

export const entries = pgTable(
  'entries',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'ent_' || encode(gen_random_bytes(12), 'hex')`),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'restrict' }),
    entryNumber: text('entry_number').notNull(),
    entryDate: date('entry_date'),
    importerOfRecord: text('importer_of_record'),
    dutyAmountUsdCents: bigint('duty_amount_usd_cents', { mode: 'number' }),
    htsCodes: text('hts_codes').array().notNull().default(sql`ARRAY[]::text[]`),
    phaseFlag: text('phase_flag'),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    validatedBy: text('validated_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    caseEntryUnique: unique('entries_case_entry_number_unique').on(
      t.caseId,
      t.entryNumber,
    ),
    byCase: index('entries_case_idx').on(t.caseId, t.createdAt),
  }),
)

export const entrySourceRecords = pgTable(
  'entry_source_records',
  {
    id: text('id')
      .primaryKey()
      .default(sql`'esrc_' || encode(gen_random_bytes(12), 'hex')`),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'restrict' }),
    recoverySourceId: text('recovery_source_id')
      .notNull()
      .references(() => recoverySources.id, { onDelete: 'restrict' }),
    rawData: jsonb('raw_data').notNull().default(sql`'{}'::jsonb`),
    confidence: text('confidence', { enum: RECOVERY_SOURCE_CONFIDENCES })
      .notNull()
      .default('pending'),
    extractedAt: timestamp('extracted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    extractedBy: text('extracted_by'),
  },
  (t) => ({
    byEntry: index('entry_source_records_entry_idx').on(t.entryId),
    bySource: index('entry_source_records_source_idx').on(t.recoverySourceId),
  }),
)

export type EntryRow = typeof entries.$inferSelect
export type NewEntryRow = typeof entries.$inferInsert
export type EntrySourceRecordRow = typeof entrySourceRecords.$inferSelect
export type NewEntrySourceRecordRow = typeof entrySourceRecords.$inferInsert
