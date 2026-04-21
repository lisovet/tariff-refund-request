import { describe, expect, it } from 'vitest'
import { createInMemoryEntriesRepo } from '../in-memory-entries-repo'
import { saveExtractedEntry } from '../save-entry'
import { createInMemoryCaseRepo } from '@contexts/ops/server'

async function setup() {
  const caseRepo = createInMemoryCaseRepo()
  const entriesRepo = createInMemoryEntriesRepo()
  const caseRecord = await caseRepo.createCase({ tier: 'smb' })
  return { caseRepo, entriesRepo, caseId: caseRecord.id }
}

const VALID_INPUT = {
  entryNumber: 'EI-2024-12345',
  entryDate: '2024-08-15',
  importerOfRecord: 'Acme Imports LLC',
  dutyAmountUsdCents: 250_000,
  htsCodes: ['8471.30.0100'] as const,
  recoverySourceId: 'rsrc_test_one',
  actorId: 'stf_42',
} as const

describe('saveExtractedEntry — first call (created)', () => {
  it('creates the entry, links a source record, and appends an audit row', async () => {
    const { caseRepo, entriesRepo, caseId } = await setup()
    const result = await saveExtractedEntry(
      { caseId, ...VALID_INPUT },
      { entriesRepo, caseRepo, clock: () => new Date('2026-04-21T12:00:00Z') },
    )

    expect(result.outcome).toBe('created')
    expect(result.entry.entryNumber).toBe('EI-2024-12345')
    expect(result.entry.dutyAmountUsdCents).toBe(250_000)
    expect(result.sourceRecord.entryId).toBe(result.entry.id)
    expect(result.sourceRecord.recoverySourceId).toBe('rsrc_test_one')
    expect(result.auditId).toBeDefined()

    const audit = await caseRepo.listAudit(caseId)
    expect(audit.find((a) => a.kind === 'entry.extracted')).toBeDefined()
    expect(audit.find((a) => a.kind === 'entry.extracted')?.actorId).toBe('stf_42')
  })

  it('the audit payload carries entryId, entryNumber, and sourceRecordId for traceability', async () => {
    const { caseRepo, entriesRepo, caseId } = await setup()
    const result = await saveExtractedEntry(
      { caseId, ...VALID_INPUT },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )
    const audit = await caseRepo.listAudit(caseId)
    const row = audit.find((a) => a.kind === 'entry.extracted')
    expect(row?.payload).toEqual({
      entryId: result.entry.id,
      entryNumber: 'EI-2024-12345',
      sourceRecordId: result.sourceRecord.id,
      recoverySourceId: 'rsrc_test_one',
    })
  })

  it('lists the saved entry on the case', async () => {
    const { caseRepo, entriesRepo, caseId } = await setup()
    await saveExtractedEntry(
      { caseId, ...VALID_INPUT },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )
    const entries = await entriesRepo.listEntriesForCase(caseId)
    expect(entries).toHaveLength(1)
    expect(entries[0]?.entryNumber).toBe('EI-2024-12345')
  })
})

describe('saveExtractedEntry — second source for the same entry (PRD 07 acceptance)', () => {
  it('attaches a second source instead of inserting a duplicate entry row', async () => {
    const { caseRepo, entriesRepo, caseId } = await setup()
    const first = await saveExtractedEntry(
      { caseId, ...VALID_INPUT, recoverySourceId: 'rsrc_first' },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )

    const second = await saveExtractedEntry(
      { caseId, ...VALID_INPUT, recoverySourceId: 'rsrc_second', actorId: 'stf_77' },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )

    expect(second.outcome).toBe('second_source_attached')
    expect(second.entry.id).toBe(first.entry.id)
    expect(second.sourceRecord.recoverySourceId).toBe('rsrc_second')

    // Only one entry row, two source records.
    expect(await entriesRepo.listEntriesForCase(caseId)).toHaveLength(1)
    expect(await entriesRepo.listSourcesForEntry(first.entry.id)).toHaveLength(2)
  })

  it('emits an entry.source_attached audit row (different kind from entry.extracted)', async () => {
    const { caseRepo, entriesRepo, caseId } = await setup()
    await saveExtractedEntry(
      { caseId, ...VALID_INPUT, recoverySourceId: 'rsrc_a' },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )
    await saveExtractedEntry(
      { caseId, ...VALID_INPUT, recoverySourceId: 'rsrc_b' },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )
    const audit = await caseRepo.listAudit(caseId)
    expect(audit.filter((a) => a.kind === 'entry.extracted')).toHaveLength(1)
    expect(audit.filter((a) => a.kind === 'entry.source_attached')).toHaveLength(1)
  })
})

describe('saveExtractedEntry — provenance never null', () => {
  it('every saved entry has at least one source record (the schema-level NOT NULL is honored)', async () => {
    const { caseRepo, entriesRepo, caseId } = await setup()
    const result = await saveExtractedEntry(
      { caseId, ...VALID_INPUT },
      { entriesRepo, caseRepo, clock: () => new Date() },
    )
    const sources = await entriesRepo.listSourcesForEntry(result.entry.id)
    expect(sources.length).toBeGreaterThan(0)
    expect(sources[0]?.recoverySourceId).toBeTruthy()
  })
})
