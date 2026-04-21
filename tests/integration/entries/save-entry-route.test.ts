import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { createInMemoryCaseRepo } from '@contexts/ops/server'
import type { createInMemoryEntriesRepo } from '@contexts/recovery/server'

const mocks = vi.hoisted(() => ({
  caseRepo: undefined as ReturnType<typeof createInMemoryCaseRepo> | undefined,
  entriesRepo: undefined as ReturnType<typeof createInMemoryEntriesRepo> | undefined,
}))

vi.mock('@contexts/ops/server', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>
  return {
    ...actual,
    getCaseRepo: () => mocks.caseRepo,
  }
})

vi.mock('@contexts/recovery/server', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>
  return {
    ...actual,
    getEntriesRepo: () => mocks.entriesRepo,
  }
})

import { POST } from '@/app/api/cases/[id]/entries/route'

function jsonReq(body: unknown, caseId = 'cas_test'): {
  req: Request
  params: { params: Promise<{ id: string }> }
} {
  return {
    req: new Request(`https://example.com/api/cases/${caseId}/entries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params: { params: Promise.resolve({ id: caseId }) },
  }
}

const VALID_BODY = {
  entryNumber: 'EI-2024-12345',
  entryDate: '2024-08-15',
  importerOfRecord: 'Acme Imports LLC',
  dutyAmountUsdCents: 250_000,
  htsCodes: ['8471.30.0100'],
  recoverySourceId: 'rsrc_test',
}

let caseId: string

beforeEach(async () => {
  const { createInMemoryCaseRepo } = await import('@contexts/ops/server')
  const { createInMemoryEntriesRepo } = await import('@contexts/recovery/server')
  mocks.caseRepo = createInMemoryCaseRepo()
  mocks.entriesRepo = createInMemoryEntriesRepo()
  const c = await mocks.caseRepo.createCase({ tier: 'smb' })
  caseId = c.id
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/cases/[id]/entries — happy path', () => {
  it('returns outcome=created on the first save and persists the entry + source link', async () => {
    const { req, params } = jsonReq(VALID_BODY, caseId)
    const res = await POST(req, params)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      outcome: string
      entry: { id: string; entryNumber: string; dutyAmountUsdCents: number }
      sourceRecord: { recoverySourceId: string; confidence: string }
      auditId: string
    }
    expect(body.outcome).toBe('created')
    expect(body.entry.entryNumber).toBe('EI-2024-12345')
    expect(body.entry.dutyAmountUsdCents).toBe(250_000)
    expect(body.sourceRecord.recoverySourceId).toBe('rsrc_test')
    expect(body.auditId).toBeDefined()

    // Audit row exists.
    const audit = await mocks.caseRepo!.listAudit(caseId)
    expect(audit.find((a) => a.kind === 'entry.extracted')).toBeDefined()
  })

  it('attaches a second source on duplicate (case_id, entry_number) instead of inserting twice', async () => {
    const first = jsonReq(VALID_BODY, caseId)
    await POST(first.req, first.params)

    const second = jsonReq(
      { ...VALID_BODY, recoverySourceId: 'rsrc_other' },
      caseId,
    )
    const res = await POST(second.req, second.params)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { outcome: string }
    expect(body.outcome).toBe('second_source_attached')

    const entries = await mocks.entriesRepo!.listEntriesForCase(caseId)
    expect(entries).toHaveLength(1)
  })
})

describe('POST /api/cases/[id]/entries — error paths', () => {
  it('400 on a malformed body', async () => {
    const { req, params } = jsonReq({ entryNumber: 'a' }, caseId) // missing recoverySourceId
    const res = await POST(req, params)
    expect(res.status).toBe(400)
  })

  it('400 on invalid date format', async () => {
    const { req, params } = jsonReq(
      { ...VALID_BODY, entryDate: 'August 2024' },
      caseId,
    )
    const res = await POST(req, params)
    expect(res.status).toBe(400)
  })

  it('404 when the case does not exist', async () => {
    const { req, params } = jsonReq(VALID_BODY, 'cas_does_not_exist')
    const res = await POST(req, params)
    expect(res.status).toBe(404)
  })

  it('400 when htsCodes exceeds the 20-code cap', async () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `${i}.0000`)
    const { req, params } = jsonReq({ ...VALID_BODY, htsCodes: tooMany }, caseId)
    const res = await POST(req, params)
    expect(res.status).toBe(400)
  })
})
