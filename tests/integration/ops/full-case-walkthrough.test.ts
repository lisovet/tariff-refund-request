import { describe, expect, it, vi } from 'vitest'
import {
  claimCase,
  reassignCase,
  releaseCase,
  transition,
  type ActorRef,
} from '@contexts/ops'
import { createInMemoryCaseRepo } from '@contexts/ops/server'
import {
  QA_CHECKLIST_ITEMS,
  signOffBatch,
  type CapeEntryRow,
  type ReadinessReport,
} from '@contexts/cape'
import {
  artifactGenerationHandler,
  type BatchSignedOffEventData,
} from '@contexts/cape/server'
import { createMemoryStorage } from '@shared/infra/storage'

/**
 * USER-TEST checkpoint #13 (task #83): ops staff run a real case
 * through the console end-to-end.
 *
 * Codification of the walkthrough that binds the ops-console
 * features together (#77 queue / #78 workspace shell / #79 audit /
 * #80 claim-release-reassign / #81 SLA) with the core pipeline
 * (#65 sign-off / #70 artifact generation). Any regression in
 * composition fails this test; human observation of real latency /
 * friction remains the subjective half.
 */

const ANALYST: ActorRef = { id: 'stf_mina', role: 'analyst' }
const COORDINATOR: ActorRef = { id: 'stf_coord', role: 'coordinator' }
const VALIDATOR: ActorRef = { id: 'stf_val', role: 'validator' }
const FIXED_NOW = new Date('2026-04-21T15:00:00.000Z')

const ENTRY: CapeEntryRow = {
  id: 'ent_u13',
  entryNumber: 'ABC-1234567-8',
  entryDate: '2024-09-15',
  importerOfRecord: 'Pioneer Optics Corp',
  dutyAmountUsdCents: 250_000,
  htsCodes: ['8501.10.4020'],
  phaseFlag: 'phase_1_2024_h2',
  windowVersion: 'ieepa-2024-v1',
  sourceConfidence: 'high',
}

const READINESS_REPORT: ReadinessReport = {
  id: 'rdy_u13',
  batchId: 'bat_u13',
  generatedAt: '2026-04-21T14:00:00.000Z',
  entries: [{ entryId: 'ent_u13', status: 'ok', notes: [] }],
  prerequisites: [{ id: 'ior_on_file', label: 'IOR on file', met: true }],
  blockingCount: 0,
  warningCount: 0,
  infoCount: 0,
  artifactKeys: {
    csvKey: 'cases/cas_u13/cape-bat_u13/readiness.csv',
    pdfKey: 'cases/cas_u13/cape-bat_u13/readiness.pdf',
  },
}

describe('USER-TEST #13 — ops staff complete a full case', () => {
  it('walks a case from creation → claim → reassign → validator sign-off → artifacts', async () => {
    const caseRepo = createInMemoryCaseRepo()
    const noopPublish = vi.fn(async () => {})

    // 1. Create the case and walk it to batch_qa (direct repo write
    //    keeps this test focused on the ops surfaces being validated).
    const c = await caseRepo.createCase({ tier: 'smb' })
    await caseRepo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'batch_qa',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date('2026-04-21T11:00:00Z'),
    })

    // 2. Analyst claims the case (#80).
    const claim = await claimCase(
      { caseId: c.id, actor: ANALYST },
      { caseRepo, clock: () => FIXED_NOW },
    )
    expect(claim.ok).toBe(true)

    // 3. Coordinator reassigns to the validator (#80).
    const reassign = await reassignCase(
      {
        caseId: c.id,
        actor: COORDINATOR,
        toStaffId: VALIDATOR.id,
      },
      { caseRepo, clock: () => FIXED_NOW },
    )
    expect(reassign.ok).toBe(true)
    const afterReassign = await caseRepo.findCase(c.id)
    expect(afterReassign?.ownerStaffId).toBe(VALIDATOR.id)

    // 4. Validator signs off the batch (#65) → publishes
    //    batch.signed-off event (#70 will consume).
    let captured: BatchSignedOffEventData | undefined
    const publishBatchSignedOff = async (event: BatchSignedOffEventData) => {
      captured = event
    }
    const signOff = await signOffBatch(
      {
        caseId: c.id,
        batchId: 'bat_u13',
        actor: VALIDATOR,
        note: 'Verified entries against broker extracts; IOR confirmed.',
        readinessReport: READINESS_REPORT,
        checklist: QA_CHECKLIST_ITEMS.map((i) => ({ itemId: i.id, checked: true })),
        artifactContext: {
          entries: [ENTRY],
          customer: {
            name: 'Pioneer Optics Corp',
            email: 'controller@pioneer-optics.test',
          },
          analystDisplayName: 'Mina Ortega',
          caseWorkspaceUrl: `https://app.example.com/app/cases/${c.id}`,
          conciergeUpgradeUrl: `https://example.com/concierge?case=${c.id}`,
        },
      },
      {
        caseRepo,
        transition: (input) =>
          transition(input, { repo: caseRepo, publishCaseTransitioned: noopPublish }),
        clock: () => FIXED_NOW,
        publishBatchSignedOff,
      },
    )
    expect(signOff.ok).toBe(true)
    if (!signOff.ok) throw new Error('unreachable')
    expect(signOff.toState).toBe('submission_ready')

    // Published payload + downstream artifact pipeline.
    expect(captured).toBeDefined()
    if (!captured) throw new Error('unreachable')

    const storage = createMemoryStorage()
    const emailSend = vi.fn(async () => ({ id: 'email_u13' }))
    const artifact = await artifactGenerationHandler(
      {
        event: { data: captured },
        step: {
          async run<T>(_name: string, fn: () => T | Promise<T>): Promise<T> {
            return fn()
          },
        },
      },
      {
        storage,
        email: { send: emailSend },
        fromAddress: 'reports@dev.tariff-refund.local',
      },
    )
    expect(artifact.ok).toBe(true)
    if (!artifact.ok) throw new Error('unreachable')
    const csvHead = await storage.headObject(artifact.csvKey)
    expect(csvHead.exists).toBe(true)
    const pdfHead = await storage.headObject(artifact.pdfKey)
    expect(pdfHead.exists).toBe(true)
    expect(emailSend).toHaveBeenCalledTimes(1)

    // 5. Audit log carries every action in chronological order.
    const audit = await caseRepo.listAudit(c.id)
    const kinds = audit.map((a) => a.kind)
    expect(kinds).toContain('SCREENER_RESULT_QUALIFIED')
    expect(kinds).toContain('case.claimed')
    expect(kinds).toContain('case.reassigned')
    expect(kinds).toContain('VALIDATOR_SIGNED_OFF')
    expect(kinds).toContain('qa.sign_off')

    // Timeline is chronologically sorted.
    for (let i = 1; i < audit.length; i += 1) {
      expect(
        audit[i]!.occurredAt.getTime() >= audit[i - 1]!.occurredAt.getTime(),
      ).toBe(true)
    }
  }, 15_000)

  it('happy path surfaces the right release-then-reclaim sequence', async () => {
    const caseRepo = createInMemoryCaseRepo()
    const c = await caseRepo.createCase({ tier: 'smb' })
    await claimCase(
      { caseId: c.id, actor: ANALYST },
      { caseRepo, clock: () => FIXED_NOW },
    )
    const released = await releaseCase(
      { caseId: c.id, actor: ANALYST },
      { caseRepo, clock: () => FIXED_NOW },
    )
    expect(released.ok).toBe(true)

    // Unowned → a coordinator reassignment lands directly.
    const assigned = await reassignCase(
      { caseId: c.id, actor: COORDINATOR, toStaffId: 'stf_other' },
      { caseRepo, clock: () => FIXED_NOW },
    )
    expect(assigned.ok).toBe(true)
    const c2 = await caseRepo.findCase(c.id)
    expect(c2?.ownerStaffId).toBe('stf_other')

    const audit = await caseRepo.listAudit(c.id)
    const kinds = audit.map((a) => a.kind)
    expect(kinds).toEqual(['case.claimed', 'case.released', 'case.reassigned'])
  })
})
