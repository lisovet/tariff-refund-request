import { describe, expect, it, vi } from 'vitest'
import {
  QA_CHECKLIST_ITEMS,
  signOffBatch,
  type SignOffBatchDeps,
  type SignOffBatchInput,
} from '../sign-off'
import type { CapeEntryRow, ReadinessReport } from '../schema'
import { createInMemoryCaseRepo } from '@contexts/ops/server'
import { transition } from '@contexts/ops'

const FIXED_NOW = new Date('2026-04-21T13:00:00.000Z')

const CLEAN_REPORT: ReadinessReport = {
  id: 'rdy_1',
  batchId: 'bat_1',
  generatedAt: '2026-04-21T12:00:00.000Z',
  entries: [{ entryId: 'ent_1', status: 'ok', notes: [] }],
  prerequisites: [],
  blockingCount: 0,
  warningCount: 0,
  infoCount: 0,
  artifactKeys: { csvKey: 'cases/cas_x/cape/v1.csv', pdfKey: 'cases/cas_x/cape/v1.pdf' },
}

const BLOCKING_REPORT: ReadinessReport = {
  ...CLEAN_REPORT,
  entries: [{ entryId: 'ent_1', status: 'blocking', notes: ['Missing IOR.'] }],
  blockingCount: 1,
}

const VALIDATOR = { id: 'stf_v', role: 'validator' as const }
const ANALYST = { id: 'stf_a', role: 'analyst' as const }
const ADMIN = { id: 'stf_admin', role: 'admin' as const }

function fullChecklist(): { itemId: string; checked: boolean }[] {
  return QA_CHECKLIST_ITEMS.map((item) => ({ itemId: item.id, checked: true }))
}

async function setupCaseInBatchQa(): Promise<{ caseId: string; deps: SignOffBatchDeps }> {
  const caseRepo = createInMemoryCaseRepo()
  const c = await caseRepo.createCase({ tier: 'smb' })
  const noopPublish = vi.fn(async () => {})
  // Walk the case to batch_qa via direct repo writes (avoids the
  // long happy-path chain).
  await caseRepo.recordTransition({
    caseId: c.id,
    from: 'new_lead',
    to: 'batch_qa',
    event: { type: 'SCREENER_RESULT_QUALIFIED' },
    actorId: null,
    occurredAt: new Date('2026-04-21T11:00:00Z'),
  })
  return {
    caseId: c.id,
    deps: {
      caseRepo,
      transition: (input) => transition(input, { repo: caseRepo, publishCaseTransitioned: noopPublish }),
      clock: () => FIXED_NOW,
    },
  }
}

function input(
  overrides: Partial<SignOffBatchInput> = {},
  caseId = 'cas_test',
): SignOffBatchInput {
  return {
    caseId,
    batchId: 'bat_1',
    actor: VALIDATOR,
    note: 'Verified entries against source documents.',
    readinessReport: CLEAN_REPORT,
    checklist: fullChecklist(),
    ...overrides,
  }
}

describe('QA_CHECKLIST_ITEMS', () => {
  it('exposes the v1 checklist with at least the must-have items', () => {
    const ids = QA_CHECKLIST_ITEMS.map((c) => c.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'entries_match_source_documents',
        'no_blocking_issues',
        'prerequisites_reviewed',
      ]),
    )
  })

  it('every item carries a label + a description (the analyst surface needs both)', () => {
    for (const item of QA_CHECKLIST_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(0)
    }
  })
})

describe('signOffBatch — happy path', () => {
  it('transitions the case to submission_ready when all checks pass + records the signoff', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()

    const result = await signOffBatch(input({}, caseId), deps)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.fromState).toBe('batch_qa')
    expect(result.toState).toBe('submission_ready')
    expect(result.signoff.staffUserId).toBe('stf_v')
    expect(result.signoff.signedAt).toBe(FIXED_NOW.toISOString())
    expect(result.signoff.note).toContain('Verified')
    expect(result.auditId).toBeDefined()
  })

  it('the case is actually in submission_ready after signoff', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    await signOffBatch(input({}, caseId), deps)
    const c = await deps.caseRepo.findCase(caseId)
    expect(c?.state).toBe('submission_ready')
  })
})

describe('signOffBatch — checklist gate', () => {
  it('rejects sign-off when any required item is unchecked', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const incomplete = fullChecklist()
    incomplete[0] = { itemId: incomplete[0]!.itemId, checked: false }
    const result = await signOffBatch(input({ checklist: incomplete }, caseId), deps)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'checklist_incomplete') {
      throw new Error('unreachable')
    }
    expect(result.missingItems).toContain(incomplete[0]!.itemId)
  })

  it('rejects when an item is missing from the submission entirely (not the same as unchecked)', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const partial = fullChecklist().slice(1) // drop the first item
    const result = await signOffBatch(input({ checklist: partial }, caseId), deps)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'checklist_incomplete') {
      throw new Error('unreachable')
    }
    expect(result.missingItems.length).toBeGreaterThan(0)
  })

  it('does NOT advance the case when checklist is incomplete', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    await signOffBatch(input({ checklist: [] }, caseId), deps)
    const c = await deps.caseRepo.findCase(caseId)
    expect(c?.state).toBe('batch_qa')
  })
})

describe('signOffBatch — blocking-issues gate', () => {
  it('rejects when the readiness report still has blocking issues', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const result = await signOffBatch(
      input({ readinessReport: BLOCKING_REPORT }, caseId),
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'blocking_issues_present') {
      throw new Error('unreachable')
    }
    expect(result.blockingCount).toBe(1)
  })

  it('does NOT advance the case when blocking issues are present', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    await signOffBatch(
      input({ readinessReport: BLOCKING_REPORT }, caseId),
      deps,
    )
    const c = await deps.caseRepo.findCase(caseId)
    expect(c?.state).toBe('batch_qa')
  })
})

describe('signOffBatch — actor role gate', () => {
  it('rejects when the actor is not a validator (analyst)', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const result = await signOffBatch(input({ actor: ANALYST }, caseId), deps)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'not_validator_role') {
      throw new Error('unreachable')
    }
    expect(result.attemptedRole).toBe('analyst')
  })

  it('rejects when the actor is admin (admin is not validator)', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const result = await signOffBatch(input({ actor: ADMIN }, caseId), deps)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'not_validator_role') {
      throw new Error('unreachable')
    }
  })

  it('rejects empty note (analyst must explain the sign-off)', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const result = await signOffBatch(input({ note: '' }, caseId), deps)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'note_empty') {
      throw new Error('unreachable')
    }
  })
})

describe('signOffBatch — artifact-generation event publishing', () => {
  const ENTRY: CapeEntryRow = {
    id: 'ent_1',
    entryNumber: '123-4567890-1',
    entryDate: '2024-09-01',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 125_000,
    htsCodes: ['8501.10.4020'],
    phaseFlag: 'phase_1_2024_h2',
    windowVersion: 'ieepa-2024-v1',
    sourceConfidence: 'high',
  }

  const ARTIFACT_CONTEXT: NonNullable<SignOffBatchInput['artifactContext']> = {
    entries: [ENTRY],
    customer: { name: 'Acme Imports LLC', email: 'finance@acme.test' },
    analystDisplayName: 'S. Validator',
    caseWorkspaceUrl: 'https://app.example.com/app/cases/X',
    conciergeUpgradeUrl: 'https://example.com/concierge',
  }

  it('publishes batch.signed-off with the full event payload on success', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    type PublishArg = Parameters<
      NonNullable<SignOffBatchDeps['publishBatchSignedOff']>
    >[0]
    const publishBatchSignedOff = vi.fn<
      (e: PublishArg) => Promise<void>
    >(async () => {})
    const result = await signOffBatch(
      input({ artifactContext: ARTIFACT_CONTEXT }, caseId),
      { ...deps, publishBatchSignedOff },
    )
    expect(result.ok).toBe(true)
    expect(publishBatchSignedOff).toHaveBeenCalledTimes(1)
    const payload = publishBatchSignedOff.mock.calls[0]?.[0]
    expect(payload?.caseId).toBe(caseId)
    expect(payload?.batchId).toBe('bat_1')
    expect(payload?.customerEmail).toBe('finance@acme.test')
    expect(payload?.customerName).toBe('Acme Imports LLC')
    expect(payload?.analystName).toBe('S. Validator')
    expect(payload?.analystNote).toContain('Verified')
    expect(payload?.entries).toEqual([ENTRY])
    expect(payload?.readinessReport.id).toBe('rdy_1')
  })

  it('does NOT publish when the artifact context is missing (sign-off still succeeds)', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const publishBatchSignedOff = vi.fn(async () => {})
    const result = await signOffBatch(input({}, caseId), {
      ...deps,
      publishBatchSignedOff,
    })
    expect(result.ok).toBe(true)
    expect(publishBatchSignedOff).not.toHaveBeenCalled()
  })

  it('swallows publisher errors (sign-off stays successful; the case is already submission_ready)', async () => {
    const { caseId, deps } = await setupCaseInBatchQa()
    const publishBatchSignedOff = vi.fn(async () => {
      throw new Error('inngest down')
    })
    const result = await signOffBatch(
      input({ artifactContext: ARTIFACT_CONTEXT }, caseId),
      { ...deps, publishBatchSignedOff },
    )
    expect(result.ok).toBe(true)
    expect(publishBatchSignedOff).toHaveBeenCalledTimes(1)
    const c = await deps.caseRepo.findCase(caseId)
    expect(c?.state).toBe('submission_ready')
  })
})

describe('signOffBatch — case in wrong state', () => {
  it('rejects when the case is not in batch_qa (transition_failed)', async () => {
    // Case starts in new_lead, not batch_qa.
    const caseRepo = createInMemoryCaseRepo()
    const c = await caseRepo.createCase({ tier: 'smb' })
    const noopPublish = vi.fn(async () => {})
    const deps: SignOffBatchDeps = {
      caseRepo,
      transition: (i) => transition(i, { repo: caseRepo, publishCaseTransitioned: noopPublish }),
      clock: () => FIXED_NOW,
    }
    const result = await signOffBatch(input({}, c.id), deps)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'transition_failed') {
      throw new Error('unreachable')
    }
  })
})
