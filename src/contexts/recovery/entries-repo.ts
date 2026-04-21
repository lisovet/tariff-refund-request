import type { RecoverySourceConfidence } from '@shared/infra/db/schema'

/**
 * EntriesRepo per PRD 07. Every saveExtractedEntry call atomically
 * writes the entry, an entry_source_record linking to the recovery
 * source, and an audit_log row on the case. Implementations MUST run
 * the three writes in a single transaction.
 *
 * UNIQUE (case_id, entry_number) at the schema level surfaces dedup
 * as outcome=duplicate_entry rather than a hard error — a re-extract
 * of the same entry from a second source attaches a new
 * entry_source_record to the existing entry instead of inserting a
 * duplicate row (PRD 07 acceptance).
 */

export interface EntryRecord {
  readonly id: string
  readonly caseId: string
  readonly entryNumber: string
  readonly entryDate: string | null
  readonly importerOfRecord: string | null
  readonly dutyAmountUsdCents: number | null
  readonly htsCodes: readonly string[]
  readonly phaseFlag: string | null
  readonly validatedAt: Date | null
  readonly validatedBy: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface EntrySourceRecord {
  readonly id: string
  readonly entryId: string
  readonly recoverySourceId: string
  readonly rawData: Record<string, unknown>
  readonly confidence: RecoverySourceConfidence
  readonly extractedAt: Date
  readonly extractedBy: string | null
}

export interface SaveExtractedEntryInput {
  readonly caseId: string
  readonly entryNumber: string
  readonly entryDate?: string | null
  readonly importerOfRecord?: string | null
  readonly dutyAmountUsdCents?: number | null
  readonly htsCodes?: readonly string[]
  readonly phaseFlag?: string | null
  readonly recoverySourceId: string
  readonly extractedBy: string | null
  readonly rawData?: Record<string, unknown>
  readonly occurredAt: Date
}

export type SaveExtractedEntryResult =
  | {
      readonly outcome: 'created'
      readonly entry: EntryRecord
      readonly sourceRecord: EntrySourceRecord
    }
  | {
      readonly outcome: 'second_source_attached'
      readonly entry: EntryRecord
      readonly sourceRecord: EntrySourceRecord
    }

export interface EntriesRepo {
  saveExtractedEntry(input: SaveExtractedEntryInput): Promise<SaveExtractedEntryResult>
  findEntryByNumber(caseId: string, entryNumber: string): Promise<EntryRecord | undefined>
  listEntriesForCase(caseId: string): Promise<readonly EntryRecord[]>
  listSourcesForEntry(entryId: string): Promise<readonly EntrySourceRecord[]>
}
