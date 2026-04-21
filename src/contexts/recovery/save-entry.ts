import type { CaseRepo } from '@contexts/ops'
import type {
  EntriesRepo,
  EntryRecord,
  EntrySourceRecord,
  SaveExtractedEntryResult,
} from './entries-repo'

/**
 * saveExtractedEntry composes the entries repo + the case service's
 * audit log. Per task #53: every save writes the entry, an
 * entry_source_record (provenance never null), AND an audit_log row
 * tagged with the actor.
 *
 * The repo's transactional contract guarantees the entry +
 * source_record write is atomic; the audit_log row is appended
 * immediately after. If the audit append throws, the entry is still
 * persisted — analogous to how transition() handles publish failure.
 */

export interface SaveExtractedEntryServiceInput {
  readonly caseId: string
  readonly entryNumber: string
  readonly entryDate?: string | null
  readonly importerOfRecord?: string | null
  readonly dutyAmountUsdCents?: number | null
  readonly htsCodes?: readonly string[]
  readonly phaseFlag?: string | null
  readonly recoverySourceId: string
  readonly actorId: string | null
  readonly rawData?: Record<string, unknown>
}

export interface SaveExtractedEntryDeps {
  readonly entriesRepo: EntriesRepo
  readonly caseRepo: CaseRepo
  readonly clock?: () => Date
}

export type SaveExtractedEntryServiceResult = {
  readonly outcome: SaveExtractedEntryResult['outcome']
  readonly entry: EntryRecord
  readonly sourceRecord: EntrySourceRecord
  readonly auditId: string
}

export async function saveExtractedEntry(
  input: SaveExtractedEntryServiceInput,
  deps: SaveExtractedEntryDeps,
): Promise<SaveExtractedEntryServiceResult> {
  const now = (deps.clock ?? defaultClock)()
  const result = await deps.entriesRepo.saveExtractedEntry({
    caseId: input.caseId,
    entryNumber: input.entryNumber,
    entryDate: input.entryDate,
    importerOfRecord: input.importerOfRecord,
    dutyAmountUsdCents: input.dutyAmountUsdCents,
    htsCodes: input.htsCodes,
    phaseFlag: input.phaseFlag,
    recoverySourceId: input.recoverySourceId,
    extractedBy: input.actorId,
    rawData: input.rawData,
    occurredAt: now,
  })

  const audit = await deps.caseRepo.appendAuditEntry({
    caseId: input.caseId,
    actorId: input.actorId,
    kind: result.outcome === 'created' ? 'entry.extracted' : 'entry.source_attached',
    payload: {
      entryId: result.entry.id,
      entryNumber: result.entry.entryNumber,
      sourceRecordId: result.sourceRecord.id,
      recoverySourceId: input.recoverySourceId,
    },
    occurredAt: now,
  })

  return {
    outcome: result.outcome,
    entry: result.entry,
    sourceRecord: result.sourceRecord,
    auditId: audit.auditId,
  }
}

function defaultClock(): Date {
  return new Date()
}
