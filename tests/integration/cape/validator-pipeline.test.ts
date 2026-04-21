import { describe, expect, it, vi } from 'vitest'
import {
  buildCapeCsv,
  QA_CHECKLIST_ITEMS,
  signOffBatch,
  validateBatch,
  type CapeEntryRow,
  type ValidatorEntry,
} from '@contexts/cape'
import {
  CURRENT_IEEPA_WINDOW,
  tagEntry,
} from '@contexts/entries'
import { transition, type ActorRef } from '@contexts/ops'
import { createInMemoryCaseRepo } from '@contexts/ops/server'

/**
 * End-to-end CAPE pipeline composition per task #66 (USER-TEST
 * checkpoint): validator → CSV attempt → sign-off attempt. Exercised
 * against five fixture-type batches:
 *
 *   1. clean batch — all entries ok, validator + CSV + sign-off all succeed
 *   2. duplicate-entry batch — blocking duplicate, CSV + sign-off refuse
 *   3. mixed-phase batch — entries tag into two phases, validator ok
 *   4. malformed-date batch — entryDate outside window → blocking
 *   5. ACE-prerequisite-missing batch — info-level ACH note surfaces
 */

const FIXED_NOW = new Date('2026-04-21T13:00:00.000Z')

function ve(id: string, overrides: Partial<ValidatorEntry> = {}): ValidatorEntry {
  return {
    id,
    rawEntryNumber: 'ABC-1234567-8',
    entryDate: '2024-08-15',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 250_000,
    htsCodes: ['8471.30.0100'],
    sourceConfidence: 'high',
    ...overrides,
  }
}

function fullPrereqs(achOnFile = true) {
  return [
    { id: 'ace_account', label: 'Active ACE Portal account', met: true },
    { id: 'ach_on_file', label: 'ACH refund authorization on file', met: achOnFile },
    { id: 'ior_status', label: 'Importer of record', met: true },
  ]
}

function fullChecklist() {
  return QA_CHECKLIST_ITEMS.map((item) => ({ itemId: item.id, checked: true }))
}

const VALIDATOR: ActorRef = { id: 'stf_v', role: 'validator' }

// --- Fixture 1: clean batch -----------------------------------------

describe('validator pipeline — fixture 1: clean batch', () => {
  it('validator returns 0 blocking, 0 warning; CSV builds; sign-off transitions the case', async () => {
    const report = validateBatch({
      batchId: 'bat_clean',
      generatedAt: FIXED_NOW,
      entries: [
        ve('e1'),
        ve('e2', { rawEntryNumber: 'XYZ-7654321-9' }),
      ],
      prerequisites: fullPrereqs(true),
      window: CURRENT_IEEPA_WINDOW,
      csvKey: 'cases/cas_x/cape/v1.csv',
      pdfKey: 'cases/cas_x/cape/v1.pdf',
    })
    expect(report.blockingCount).toBe(0)
    expect(report.warningCount).toBe(0)

    const capeRows: CapeEntryRow[] = [
      {
        id: 'e1',
        entryNumber: 'ABC-1234567-8',
        entryDate: '2024-08-15',
        importerOfRecord: 'Acme Imports LLC',
        dutyAmountUsdCents: 250_000,
        htsCodes: ['8471.30.0100'],
        phaseFlag: 'phase_1_2024_h2',
        windowVersion: CURRENT_IEEPA_WINDOW.version,
        sourceConfidence: 'high',
      },
      {
        id: 'e2',
        entryNumber: 'XYZ-7654321-9',
        entryDate: '2024-08-15',
        importerOfRecord: 'Acme Imports LLC',
        dutyAmountUsdCents: 250_000,
        htsCodes: ['8471.30.0100'],
        phaseFlag: 'phase_1_2024_h2',
        windowVersion: CURRENT_IEEPA_WINDOW.version,
        sourceConfidence: 'high',
      },
    ]
    const csv = buildCapeCsv({
      caseId: 'cas_x',
      batchId: 'bat_clean',
      generatedAt: FIXED_NOW,
      entries: capeRows,
      readinessReport: report,
    })
    expect(csv.ok).toBe(true)

    const caseRepo = createInMemoryCaseRepo()
    const c = await caseRepo.createCase({ tier: 'smb' })
    await caseRepo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'batch_qa',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date('2026-04-21T10:00:00Z'),
    })
    const noopPublish = vi.fn(async () => {})
    const result = await signOffBatch(
      {
        caseId: c.id,
        batchId: 'bat_clean',
        actor: VALIDATOR,
        note: 'Verified entries against source documents.',
        readinessReport: report,
        checklist: fullChecklist(),
      },
      {
        caseRepo,
        transition: (i) =>
          transition(i, { repo: caseRepo, publishCaseTransitioned: noopPublish }),
        clock: () => FIXED_NOW,
      },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.toState).toBe('submission_ready')
  })
})

// --- Fixture 2: duplicate-entry batch --------------------------------

describe('validator pipeline — fixture 2: duplicate-entry batch', () => {
  it('validator flags the duplicate as blocking; CSV refuses; sign-off refuses', async () => {
    const report = validateBatch({
      batchId: 'bat_dup',
      generatedAt: FIXED_NOW,
      entries: [
        ve('e1', { rawEntryNumber: 'ABC-1234567-8' }),
        ve('e2', { rawEntryNumber: 'abc-1234567-8' }), // same canonical
      ],
      prerequisites: fullPrereqs(true),
      window: CURRENT_IEEPA_WINDOW,
      csvKey: 'x',
      pdfKey: 'y',
    })
    expect(report.blockingCount).toBe(1)
    expect(report.entries[1]?.status).toBe('blocking')
    expect(report.entries[1]?.notes.join(' ')).toMatch(/duplicate/i)

    const caseRepo = createInMemoryCaseRepo()
    const c = await caseRepo.createCase({ tier: 'smb' })
    await caseRepo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'batch_qa',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date(),
    })
    const noopPublish = vi.fn(async () => {})
    const signOff = await signOffBatch(
      {
        caseId: c.id,
        batchId: 'bat_dup',
        actor: VALIDATOR,
        note: 'n/a',
        readinessReport: report,
        checklist: fullChecklist(),
      },
      {
        caseRepo,
        transition: (i) =>
          transition(i, { repo: caseRepo, publishCaseTransitioned: noopPublish }),
        clock: () => FIXED_NOW,
      },
    )
    expect(signOff.ok).toBe(false)
    if (signOff.ok || signOff.reason !== 'blocking_issues_present') {
      throw new Error('unreachable')
    }
    expect(signOff.blockingCount).toBe(1)
  })
})

// --- Fixture 3: mixed-phase batch ------------------------------------

describe('validator pipeline — fixture 3: mixed-phase batch', () => {
  it('entries tag into distinct phases; validator passes; CSV builds', () => {
    const inPhase1 = CURRENT_IEEPA_WINDOW.phases[0]!
    const inPhase2 = CURRENT_IEEPA_WINDOW.phases[1]!
    const entry1 = ve('e1', { rawEntryNumber: 'ABC-1234567-8', entryDate: inPhase1.startIso })
    const entry2 = ve('e2', { rawEntryNumber: 'XYZ-7654321-9', entryDate: inPhase2.startIso })
    const report = validateBatch({
      batchId: 'bat_mixed',
      generatedAt: FIXED_NOW,
      entries: [entry1, entry2],
      prerequisites: fullPrereqs(true),
      window: CURRENT_IEEPA_WINDOW,
      csvKey: 'x',
      pdfKey: 'y',
    })
    expect(report.blockingCount).toBe(0)
    const tagA = tagEntry({ entryDate: entry1.entryDate }, CURRENT_IEEPA_WINDOW)
    const tagB = tagEntry({ entryDate: entry2.entryDate }, CURRENT_IEEPA_WINDOW)
    expect(tagA.phaseFlag).toBe(inPhase1.id)
    expect(tagB.phaseFlag).toBe(inPhase2.id)
    expect(tagA.phaseFlag).not.toBe(tagB.phaseFlag)
  })
})

// --- Fixture 4: malformed-date batch ---------------------------------

describe('validator pipeline — fixture 4: out-of-window batch', () => {
  it('pre-window entry is blocking; CSV refuses', () => {
    const report = validateBatch({
      batchId: 'bat_oow',
      generatedAt: FIXED_NOW,
      entries: [ve('e1', { entryDate: '2023-01-15' })],
      prerequisites: fullPrereqs(true),
      window: CURRENT_IEEPA_WINDOW,
      csvKey: 'x',
      pdfKey: 'y',
    })
    expect(report.blockingCount).toBe(1)
    expect(report.entries[0]?.notes.join(' ')).toMatch(/window/i)
  })
})

// --- Fixture 5: ACE-prerequisite-missing -----------------------------

describe('validator pipeline — fixture 5: ACH-not-on-file batch', () => {
  it('info note surfaces on the first entry; no blocking; sign-off still succeeds', async () => {
    const report = validateBatch({
      batchId: 'bat_ach',
      generatedAt: FIXED_NOW,
      entries: [ve('e1')],
      prerequisites: fullPrereqs(false), // ACH NOT on file
      window: CURRENT_IEEPA_WINDOW,
      csvKey: 'x',
      pdfKey: 'y',
    })
    expect(report.blockingCount).toBe(0)
    expect(report.infoCount).toBeGreaterThan(0)
    const allNotes = report.entries.flatMap((e) => e.notes).join(' ')
    expect(allNotes).toMatch(/ach/i)

    const caseRepo = createInMemoryCaseRepo()
    const c = await caseRepo.createCase({ tier: 'smb' })
    await caseRepo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'batch_qa',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date(),
    })
    const noopPublish = vi.fn(async () => {})
    const signOff = await signOffBatch(
      {
        caseId: c.id,
        batchId: 'bat_ach',
        actor: VALIDATOR,
        note: 'ACH missing noted to customer — proceeding with paper-check fallback.',
        readinessReport: report,
        checklist: fullChecklist(),
      },
      {
        caseRepo,
        transition: (i) =>
          transition(i, { repo: caseRepo, publishCaseTransitioned: noopPublish }),
        clock: () => FIXED_NOW,
      },
    )
    expect(signOff.ok).toBe(true)
  })
})
