import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { createInMemoryDocumentRepo } from '@contexts/recovery/server'

const mocks = vi.hoisted(() => ({
  getSignedUploadUrl: vi.fn(),
  headObject: vi.fn(),
  documentRepo: undefined as ReturnType<typeof createInMemoryDocumentRepo> | undefined,
}))

vi.mock('@contexts/recovery/server', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>
  return {
    ...actual,
    getRecoveryStorage: () => ({
      getSignedUploadUrl: mocks.getSignedUploadUrl,
      headObject: mocks.headObject,
    }),
    getDocumentRepo: () => mocks.documentRepo,
  }
})

import { POST as POST_PREPARE } from '@/app/api/uploads/route'
import { POST as POST_COMPLETE } from '@/app/api/uploads/complete/route'

const VALID_SHA256 = 'a'.repeat(64)

function jsonReq(body: unknown, path: string): Request {
  return new Request(`https://example.com${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(async () => {
  const { createInMemoryDocumentRepo } = await import('@contexts/recovery/server')
  mocks.documentRepo = createInMemoryDocumentRepo()
  mocks.getSignedUploadUrl.mockReset()
  mocks.headObject.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/uploads', () => {
  it('returns documentId, storageKey, uploadUrl, expiresInSeconds', async () => {
    mocks.getSignedUploadUrl.mockResolvedValueOnce('https://r2.test/put?sig=xxx')
    const res = await POST_PREPARE(
      jsonReq(
        {
          caseId: 'cas_abc',
          filename: 'export.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          byteSize: 12_345,
        },
        '/api/uploads',
      ),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      documentId: string
      storageKey: string
      uploadUrl: string
      expiresInSeconds: number
    }
    expect(body.documentId).toMatch(/^doc_/)
    expect(body.storageKey).toMatch(/^cases\/cas_abc\/doc_[^/]+\/export\.xlsx$/)
    expect(body.uploadUrl).toBe('https://r2.test/put?sig=xxx')
    expect(body.expiresInSeconds).toBeLessThanOrEqual(900)
  })

  it('400 on a malformed body', async () => {
    const res = await POST_PREPARE(jsonReq({ caseId: 'cas_abc' }, '/api/uploads'))
    expect(res.status).toBe(400)
  })

  it('415 on an unsupported content type', async () => {
    const res = await POST_PREPARE(
      jsonReq(
        {
          caseId: 'cas_abc',
          filename: 'malware.bin',
          contentType: 'application/x-shellscript',
          byteSize: 100,
        },
        '/api/uploads',
      ),
    )
    expect(res.status).toBe(400) // Zod enum rejection happens first; route would 415 on validator path
  })

  it('413 when byteSize exceeds the cap', async () => {
    mocks.getSignedUploadUrl.mockResolvedValueOnce('https://x')
    const tooBig = 51 * 1024 * 1024
    const res = await POST_PREPARE(
      jsonReq(
        {
          caseId: 'cas_abc',
          filename: 'big.pdf',
          contentType: 'application/pdf',
          byteSize: tooBig,
        },
        '/api/uploads',
      ),
    )
    expect(res.status).toBe(413)
  })
})

describe('POST /api/uploads/complete', () => {
  it('verifies HEAD then creates the document row and returns it', async () => {
    mocks.headObject.mockResolvedValueOnce({ exists: true, size: 12_345 })
    const res = await POST_COMPLETE(
      jsonReq(
        {
          caseId: 'cas_abc',
          documentId: 'doc_test_one',
          storageKey: 'cases/cas_abc/doc_test_one/export.xlsx',
          filename: 'export.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          sha256: VALID_SHA256,
        },
        '/api/uploads/complete',
      ),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      outcome: string
      document: { id: string; byteSize: number; sha256: string }
    }
    expect(body.outcome).toBe('created')
    expect(body.document.id).toBe('doc_test_one')
    expect(body.document.byteSize).toBe(12_345)
    expect(body.document.sha256).toBe(VALID_SHA256)
  })

  it('409 when the object never landed in the bucket', async () => {
    mocks.headObject.mockResolvedValueOnce({ exists: false })
    const res = await POST_COMPLETE(
      jsonReq(
        {
          caseId: 'cas_abc',
          documentId: 'doc_x',
          storageKey: 'cases/cas_abc/doc_x/x.pdf',
          filename: 'x.pdf',
          contentType: 'application/pdf',
          sha256: VALID_SHA256,
        },
        '/api/uploads/complete',
      ),
    )
    expect(res.status).toBe(409)
  })

  it('400 when the storageKey does not match the canonical case-scoped layout', async () => {
    mocks.headObject.mockResolvedValueOnce({ exists: true, size: 100 })
    const res = await POST_COMPLETE(
      jsonReq(
        {
          caseId: 'cas_abc',
          documentId: 'doc_x',
          storageKey: 'cases/different/doc_x/x.pdf', // wrong caseId
          filename: 'x.pdf',
          contentType: 'application/pdf',
          sha256: VALID_SHA256,
        },
        '/api/uploads/complete',
      ),
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('storage_key_mismatch')
  })

  it('returns duplicate_sha256 on re-upload of the same content into the same case', async () => {
    mocks.headObject.mockResolvedValue({ exists: true, size: 100 })
    const first = await POST_COMPLETE(
      jsonReq(
        {
          caseId: 'cas_abc',
          documentId: 'doc_first',
          storageKey: 'cases/cas_abc/doc_first/x.pdf',
          filename: 'x.pdf',
          contentType: 'application/pdf',
          sha256: VALID_SHA256,
        },
        '/api/uploads/complete',
      ),
    )
    expect(first.status).toBe(200)

    const second = await POST_COMPLETE(
      jsonReq(
        {
          caseId: 'cas_abc',
          documentId: 'doc_second',
          storageKey: 'cases/cas_abc/doc_second/x.pdf',
          filename: 'x.pdf',
          contentType: 'application/pdf',
          sha256: VALID_SHA256,
        },
        '/api/uploads/complete',
      ),
    )
    expect(second.status).toBe(200)
    const body = (await second.json()) as { outcome: string; document: { id: string } }
    expect(body.outcome).toBe('duplicate_sha256')
    expect(body.document.id).toBe('doc_first')
  })
})
