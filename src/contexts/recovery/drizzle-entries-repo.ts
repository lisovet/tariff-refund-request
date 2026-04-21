import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import {
  entries,
  entrySourceRecords,
  type Schema,
} from '@shared/infra/db/schema'
import type {
  EntriesRepo,
  EntryRecord,
  EntrySourceRecord,
  SaveExtractedEntryInput,
  SaveExtractedEntryResult,
} from './entries-repo'

/**
 * Drizzle-backed EntriesRepo. saveExtractedEntry runs inside a single
 * db.transaction so the entry insert + source-record insert commit
 * together. UNIQUE (case_id, entry_number) is the dedupe primitive:
 * we look up the existing entry first; if absent insert; if a race
 * loses to another writer the unique-violation catch re-looks-up and
 * attaches a second source.
 */

export function createDrizzleEntriesRepo(
  db: PostgresJsDatabase<Schema>,
): EntriesRepo {
  return {
    async saveExtractedEntry(input: SaveExtractedEntryInput): Promise<SaveExtractedEntryResult> {
      return db.transaction(async (tx) => {
        const existingRows = await tx
          .select()
          .from(entries)
          .where(and(eq(entries.caseId, input.caseId), eq(entries.entryNumber, input.entryNumber)))
          .limit(1)
        const existing = existingRows[0]

        if (existing) {
          const inserted = await tx
            .insert(entrySourceRecords)
            .values({
              entryId: existing.id,
              recoverySourceId: input.recoverySourceId,
              rawData: (input.rawData ?? {}) as Record<string, unknown>,
              extractedBy: input.extractedBy,
              extractedAt: input.occurredAt,
            })
            .returning()
          const srcRow = inserted[0]
          if (!srcRow) throw new Error('saveExtractedEntry: source insert returned no rows')
          return {
            outcome: 'second_source_attached',
            entry: mapEntry(existing),
            sourceRecord: mapSource(srcRow),
          }
        }

        const insertedEntries = await tx
          .insert(entries)
          .values({
            caseId: input.caseId,
            entryNumber: input.entryNumber,
            entryDate: input.entryDate ?? null,
            importerOfRecord: input.importerOfRecord ?? null,
            dutyAmountUsdCents: input.dutyAmountUsdCents ?? null,
            htsCodes: [...(input.htsCodes ?? [])],
            phaseFlag: input.phaseFlag ?? null,
            createdAt: input.occurredAt,
            updatedAt: input.occurredAt,
          })
          .returning()
        const entryRow = insertedEntries[0]
        if (!entryRow) throw new Error('saveExtractedEntry: entry insert returned no rows')

        const insertedSources = await tx
          .insert(entrySourceRecords)
          .values({
            entryId: entryRow.id,
            recoverySourceId: input.recoverySourceId,
            rawData: (input.rawData ?? {}) as Record<string, unknown>,
            extractedBy: input.extractedBy,
            extractedAt: input.occurredAt,
          })
          .returning()
        const srcRow = insertedSources[0]
        if (!srcRow) throw new Error('saveExtractedEntry: source insert returned no rows')

        return {
          outcome: 'created',
          entry: mapEntry(entryRow),
          sourceRecord: mapSource(srcRow),
        }
      })
    },
    async findEntryByNumber(caseId, entryNumber) {
      const rows = await db
        .select()
        .from(entries)
        .where(and(eq(entries.caseId, caseId), eq(entries.entryNumber, entryNumber)))
        .limit(1)
      return rows[0] ? mapEntry(rows[0]) : undefined
    },
    async listEntriesForCase(caseId) {
      const rows = await db
        .select()
        .from(entries)
        .where(eq(entries.caseId, caseId))
        .orderBy(desc(entries.createdAt))
      return rows.map(mapEntry)
    },
    async listSourcesForEntry(entryId) {
      const rows = await db
        .select()
        .from(entrySourceRecords)
        .where(eq(entrySourceRecords.entryId, entryId))
        .orderBy(asc(entrySourceRecords.extractedAt))
      return rows.map(mapSource)
    },
  }
}

type EntryDbRow = typeof entries.$inferSelect
type SourceDbRow = typeof entrySourceRecords.$inferSelect

function mapEntry(row: EntryDbRow): EntryRecord {
  return {
    id: row.id,
    caseId: row.caseId,
    entryNumber: row.entryNumber,
    entryDate: row.entryDate,
    importerOfRecord: row.importerOfRecord,
    dutyAmountUsdCents: row.dutyAmountUsdCents != null ? Number(row.dutyAmountUsdCents) : null,
    htsCodes: row.htsCodes ?? [],
    phaseFlag: row.phaseFlag,
    validatedAt: row.validatedAt,
    validatedBy: row.validatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapSource(row: SourceDbRow): EntrySourceRecord {
  return {
    id: row.id,
    entryId: row.entryId,
    recoverySourceId: row.recoverySourceId,
    rawData: (row.rawData ?? {}) as Record<string, unknown>,
    confidence: row.confidence,
    extractedAt: row.extractedAt,
    extractedBy: row.extractedBy,
  }
}
