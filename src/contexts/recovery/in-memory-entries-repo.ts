import type {
  EntriesRepo,
  EntryRecord,
  EntrySourceRecord,
  SaveExtractedEntryInput,
  SaveExtractedEntryResult,
} from './entries-repo'

let entryCounter = 0
let sourceCounter = 0
function entryId(): string {
  entryCounter += 1
  return `ent_mem_${String(entryCounter).padStart(6, '0')}`
}
function sourceRecordId(): string {
  sourceCounter += 1
  return `esrc_mem_${String(sourceCounter).padStart(6, '0')}`
}

export function createInMemoryEntriesRepo(): EntriesRepo {
  const entries = new Map<string, EntryRecord>()
  const byCaseEntryNumber = new Map<string, string>() // `${caseId}__${entryNumber}` → entryId
  const sources: EntrySourceRecord[] = []

  return {
    async saveExtractedEntry(input: SaveExtractedEntryInput): Promise<SaveExtractedEntryResult> {
      const dedupeKey = `${input.caseId}__${input.entryNumber}`
      const existingId = byCaseEntryNumber.get(dedupeKey)

      if (existingId) {
        const existing = entries.get(existingId)
        if (existing) {
          // Attach a second source instead of inserting a duplicate
          // entry (PRD 07 acceptance).
          const sourceRecord: EntrySourceRecord = {
            id: sourceRecordId(),
            entryId: existing.id,
            recoverySourceId: input.recoverySourceId,
            rawData: input.rawData ?? {},
            confidence: 'pending',
            extractedAt: input.occurredAt,
            extractedBy: input.extractedBy,
          }
          sources.push(sourceRecord)
          return { outcome: 'second_source_attached', entry: existing, sourceRecord }
        }
      }

      const newEntry: EntryRecord = {
        id: entryId(),
        caseId: input.caseId,
        entryNumber: input.entryNumber,
        entryDate: input.entryDate ?? null,
        importerOfRecord: input.importerOfRecord ?? null,
        dutyAmountUsdCents: input.dutyAmountUsdCents ?? null,
        htsCodes: input.htsCodes ?? [],
        phaseFlag: input.phaseFlag ?? null,
        validatedAt: null,
        validatedBy: null,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
      }
      entries.set(newEntry.id, newEntry)
      byCaseEntryNumber.set(dedupeKey, newEntry.id)

      const sourceRecord: EntrySourceRecord = {
        id: sourceRecordId(),
        entryId: newEntry.id,
        recoverySourceId: input.recoverySourceId,
        rawData: input.rawData ?? {},
        confidence: 'pending',
        extractedAt: input.occurredAt,
        extractedBy: input.extractedBy,
      }
      sources.push(sourceRecord)

      return { outcome: 'created', entry: newEntry, sourceRecord }
    },
    async findEntryByNumber(caseId: string, entryNumber: string) {
      const id = byCaseEntryNumber.get(`${caseId}__${entryNumber}`)
      return id ? entries.get(id) : undefined
    },
    async listEntriesForCase(caseId: string) {
      return [...entries.values()]
        .filter((e) => e.caseId === caseId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    async listSourcesForEntry(entryId: string) {
      return sources.filter((s) => s.entryId === entryId)
    },
  }
}
