import { describe, expect, it, vi } from 'vitest'
import {
  artifactGenerationHandler,
  type ArtifactGenerationHandlerDeps,
  type ArtifactGenerationHandlerInput,
  type BatchSignedOffEventData,
} from '../artifact-generation'
import { createMemoryStorage } from '@shared/infra/storage'
import type { CapeEntryRow, ReadinessReport } from '../../schema'

function makeStep(): ArtifactGenerationHandlerInput['step'] {
  // Inngest's step.run memoizes on the step name for retry safety; the
  // test stub mirrors that contract — same name returns same result,
  // no matter how often it's called.
  const cache = new Map<string, unknown>()
  return {
    async run<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
      if (cache.has(name)) return cache.get(name) as T
      const result = await fn()
      cache.set(name, result)
      return result
    },
  }
}

const ENTRIES: CapeEntryRow[] = [
  {
    id: 'ent_1',
    entryNumber: '123-4567890-1',
    entryDate: '2024-09-01',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 125_000,
    htsCodes: ['8501.10.4020'],
    phaseFlag: 'phase_1_2024_h2',
    windowVersion: 'ieepa-2024-v1',
    sourceConfidence: 'high',
  },
  {
    id: 'ent_2',
    entryNumber: '123-4567890-2',
    entryDate: '2024-09-02',
    importerOfRecord: 'Acme Imports LLC',
    dutyAmountUsdCents: 250_000,
    htsCodes: ['8501.10.4020'],
    phaseFlag: 'phase_1_2024_h2',
    windowVersion: 'ieepa-2024-v1',
    sourceConfidence: 'high',
  },
]

const CLEAN_REPORT: ReadinessReport = {
  id: 'rdy_1',
  batchId: 'bat_42',
  generatedAt: '2026-04-21T12:00:00.000Z',
  entries: [
    { entryId: 'ent_1', status: 'ok', notes: [] },
    { entryId: 'ent_2', status: 'ok', notes: [] },
  ],
  prerequisites: [{ id: 'ior_on_file', label: 'IOR on file', met: true }],
  blockingCount: 0,
  warningCount: 0,
  infoCount: 0,
  artifactKeys: {
    csvKey: 'cases/cas_test_7/cape-bat_42/readiness.csv',
    pdfKey: 'cases/cas_test_7/cape-bat_42/readiness.pdf',
  },
}

const BASE_EVENT: BatchSignedOffEventData = {
  caseId: 'cas_test_7',
  batchId: 'bat_42',
  readinessReportId: 'rdy_1',
  signedAtIso: '2026-04-21T13:00:00.000Z',
  analystId: 'stf_v',
  analystName: 'S. Validator',
  analystNote: 'Verified entries against source documents.',
  customerEmail: 'finance@acme.test',
  customerName: 'Acme Imports LLC',
  readinessReport: CLEAN_REPORT,
  entries: ENTRIES,
  caseWorkspaceUrl: 'https://app.example.com/app/cases/cas_test_7',
  conciergeUpgradeUrl: 'https://example.com/concierge?case=cas_test_7',
}

const BLOCKING_REPORT: ReadinessReport = {
  ...CLEAN_REPORT,
  entries: [
    { entryId: 'ent_1', status: 'blocking', notes: ['Missing IOR.'] },
    { entryId: 'ent_2', status: 'ok', notes: [] },
  ],
  blockingCount: 1,
}

function makeDeps(): {
  deps: ArtifactGenerationHandlerDeps
  storage: ReturnType<typeof createMemoryStorage>
  emailSend: ReturnType<typeof vi.fn>
} {
  const storage = createMemoryStorage()
  const emailSend = vi.fn(async () => ({ id: 'email_msg_1' }))
  const deps: ArtifactGenerationHandlerDeps = {
    storage,
    email: {
      send: emailSend,
    },
    fromAddress: 'test@tariff-refund.local',
    readUrlExpirySeconds: 600,
  }
  return { deps, storage, emailSend }
}

describe('artifactGenerationHandler — happy path', () => {
  it('uploads CSV + PDF to case-scoped keys and emails signed URLs', async () => {
    const { deps, storage, emailSend } = makeDeps()
    const result = await artifactGenerationHandler(
      { event: { data: BASE_EVENT }, step: makeStep() },
      deps,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.csvKey).toBe('cases/cas_test_7/cape-bat_42/readiness.csv')
    expect(result.pdfKey).toBe('cases/cas_test_7/cape-bat_42/readiness.pdf')
    expect(result.csvSignedUrl.length).toBeGreaterThan(0)
    expect(result.pdfSignedUrl.length).toBeGreaterThan(0)
    expect(result.emailMessageId).toBe('email_msg_1')

    const csvHead = await storage.headObject(result.csvKey)
    expect(csvHead.exists).toBe(true)
    expect((csvHead.size ?? 0) > 100).toBe(true)

    const pdfHead = await storage.headObject(result.pdfKey)
    expect(pdfHead.exists).toBe(true)
    expect((pdfHead.size ?? 0) > 1_000).toBe(true)

    const csvBytes = await storage.getObject(result.csvKey)
    const csvText = csvBytes.toString('utf8')
    expect(csvText).toContain('123-4567890-1')
    expect(csvText).toContain('123-4567890-2')

    const pdfBytes = await storage.getObject(result.pdfKey)
    expect(pdfBytes.slice(0, 5).toString('ascii')).toBe('%PDF-')

    expect(emailSend).toHaveBeenCalledTimes(1)
    const call = emailSend.mock.calls[0]?.[0] as {
      to: string
      from: string
      subject: string
      html: string
      text: string
      idempotencyKey?: string
    }
    expect(call.to).toBe('finance@acme.test')
    expect(call.from).toBe('test@tariff-refund.local')
    expect(call.idempotencyKey).toBe('batch-signed-off:bat_42')
    expect(call.html).toContain(result.pdfSignedUrl)
  }, 15_000)

  it('is idempotent — running the same handler twice yields the same result', async () => {
    const { deps, emailSend } = makeDeps()
    const step = makeStep()
    const r1 = await artifactGenerationHandler(
      { event: { data: BASE_EVENT }, step },
      deps,
    )
    const r2 = await artifactGenerationHandler(
      { event: { data: BASE_EVENT }, step },
      deps,
    )
    expect(r1).toEqual(r2)
    // One email per execution (the replay-driven second call uses the
    // memoized step cache, so we don't actually call send again).
    expect(emailSend).toHaveBeenCalledTimes(1)
  }, 15_000)
})

describe('artifactGenerationHandler — gated rejections', () => {
  it('refuses to generate artifacts when the readiness report has blocking issues', async () => {
    const { deps, emailSend, storage } = makeDeps()
    const blockingEvent: BatchSignedOffEventData = {
      ...BASE_EVENT,
      readinessReport: BLOCKING_REPORT,
    }
    const result = await artifactGenerationHandler(
      { event: { data: blockingEvent }, step: makeStep() },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('blocking_issues_present')
    expect(emailSend).not.toHaveBeenCalled()
    const head = await storage.headObject(
      'cases/cas_test_7/cape-bat_42/readiness.csv',
    )
    expect(head.exists).toBe(false)
  })

  it('refuses when the entries list is empty', async () => {
    const { deps, emailSend } = makeDeps()
    const emptyEvent: BatchSignedOffEventData = {
      ...BASE_EVENT,
      entries: [],
      readinessReport: {
        ...CLEAN_REPORT,
        entries: [],
      },
    }
    const result = await artifactGenerationHandler(
      { event: { data: emptyEvent }, step: makeStep() },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('csv_build_failed')
    expect(emailSend).not.toHaveBeenCalled()
  })
})

describe('artifactGenerationHandler — key discipline', () => {
  it('generates a key that is a valid storage key and matches the cape-scoped layout', async () => {
    const { deps } = makeDeps()
    const result = await artifactGenerationHandler(
      { event: { data: BASE_EVENT }, step: makeStep() },
      deps,
    )
    if (!result.ok) throw new Error('unreachable')
    expect(result.csvKey).toMatch(/^cases\/[^/]+\/cape-[^/]+\/readiness\.csv$/)
    expect(result.pdfKey).toMatch(/^cases\/[^/]+\/cape-[^/]+\/readiness\.pdf$/)
  })
})
