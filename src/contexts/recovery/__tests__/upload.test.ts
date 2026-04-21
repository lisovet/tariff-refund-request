import { describe, expect, it, vi } from 'vitest'
import { createInMemoryDocumentRepo } from '../in-memory-document-repo'
import {
  completeUpload,
  prepareUpload,
  type CompleteUploadDeps,
  type PrepareUploadDeps,
} from '../upload'

const VALID_SHA256 = 'a'.repeat(64)
const ANOTHER_SHA256 = 'b'.repeat(64)

function makeStorageStub(overrides?: Partial<{
  signedUrl: string
  exists: boolean
  size: number
}>) {
  return {
    getSignedUploadUrl: vi.fn(async () => overrides?.signedUrl ?? 'https://r2.test/upload?sig=xyz'),
    headObject: vi.fn(async () => ({
      exists: overrides?.exists ?? true,
      size: overrides?.size ?? 1234,
    })),
  }
}

function makePrepareDeps(overrides?: Partial<PrepareUploadDeps>): PrepareUploadDeps {
  const storage = makeStorageStub()
  return {
    storage,
    newDocumentId: () => 'doc_test_one',
    expirySeconds: 900,
    ...overrides,
  }
}

describe('prepareUpload', () => {
  it('returns a 15-min pre-signed URL + case-scoped storage key for a valid request', async () => {
    const deps = makePrepareDeps()
    const result = await prepareUpload(
      {
        caseId: 'cas_abc',
        filename: 'broker-export.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        byteSize: 1_500_000,
      },
      deps,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.documentId).toBe('doc_test_one')
    expect(result.storageKey).toBe('cases/cas_abc/doc_test_one/broker-export.xlsx')
    expect(result.uploadUrl).toBe('https://r2.test/upload?sig=xyz')
    expect(result.expiresInSeconds).toBe(900)
  })

  it('caps expiry to MAX_UPLOAD_URL_EXPIRY_SECONDS even when caller asks for more', async () => {
    const deps = makePrepareDeps({ expirySeconds: 7_200 })
    const result = await prepareUpload(
      {
        caseId: 'cas_abc',
        filename: 'a.pdf',
        contentType: 'application/pdf',
        byteSize: 100,
      },
      deps,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.expiresInSeconds).toBe(900)
  })

  it('returns the validation error when the request is malformed (does NOT call storage)', async () => {
    const deps = makePrepareDeps()
    const result = await prepareUpload(
      {
        caseId: 'cas_abc',
        filename: '../../etc/passwd',
        contentType: 'application/pdf',
        byteSize: 100,
      },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.error).toBe('filename_invalid')
    expect(deps.storage.getSignedUploadUrl).not.toHaveBeenCalled()
  })

  it('rejects an unsupported content type before signing', async () => {
    const deps = makePrepareDeps()
    const result = await prepareUpload(
      {
        caseId: 'cas_abc',
        filename: 'malware.bin',
        contentType: 'application/x-shellscript',
        byteSize: 100,
      },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.error).toBe('content_type_unsupported')
  })
})

function makeCompleteDeps(overrides?: Partial<CompleteUploadDeps>): CompleteUploadDeps {
  return {
    storage: makeStorageStub(),
    documentRepo: createInMemoryDocumentRepo(),
    clock: () => new Date('2026-04-21T11:00:00Z'),
    ...overrides,
  }
}

describe('completeUpload', () => {
  it('verifies the object lands in the bucket, then inserts a document row', async () => {
    const deps = makeCompleteDeps()
    const result = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_test_one',
        storageKey: 'cases/cas_abc/doc_test_one/broker-export.xlsx',
        filename: 'broker-export.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sha256: VALID_SHA256,
      },
      deps,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.outcome).toBe('created')
    expect(result.document).toMatchObject({
      id: 'doc_test_one',
      caseId: 'cas_abc',
      storageKey: 'cases/cas_abc/doc_test_one/broker-export.xlsx',
      filename: 'broker-export.xlsx',
      sha256: VALID_SHA256,
      byteSize: 1234,
      uploadedBy: 'customer',
      uploadedByActorId: null,
    })
  })

  it('returns object_not_uploaded when HEAD finds nothing in the bucket', async () => {
    const deps = makeCompleteDeps({
      storage: makeStorageStub({ exists: false }),
    })
    const result = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_x',
        storageKey: 'cases/cas_abc/doc_x/file.pdf',
        filename: 'file.pdf',
        contentType: 'application/pdf',
        sha256: VALID_SHA256,
      },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.error).toBe('object_not_uploaded')
  })

  it('returns storage_key_mismatch when the client lies about the storage key', async () => {
    const deps = makeCompleteDeps()
    const result = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_x',
        storageKey: 'cases/different/doc_x/file.pdf', // wrong caseId
        filename: 'file.pdf',
        contentType: 'application/pdf',
        sha256: VALID_SHA256,
      },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.error).toBe('storage_key_mismatch')
  })

  it('rejects malformed sha256 (must be 64 hex chars)', async () => {
    const deps = makeCompleteDeps()
    const result = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_x',
        storageKey: 'cases/cas_abc/doc_x/file.pdf',
        filename: 'file.pdf',
        contentType: 'application/pdf',
        sha256: 'not-a-hash',
      },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.error).toBe('sha256_invalid')
  })

  it('surfaces duplicate_sha256 when the same content is re-uploaded into the same case', async () => {
    const documentRepo = createInMemoryDocumentRepo()
    const deps = makeCompleteDeps({ documentRepo })

    const first = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_first',
        storageKey: 'cases/cas_abc/doc_first/x.pdf',
        filename: 'x.pdf',
        contentType: 'application/pdf',
        sha256: VALID_SHA256,
      },
      deps,
    )
    expect(first.ok).toBe(true)

    const second = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_second',
        storageKey: 'cases/cas_abc/doc_second/x.pdf',
        filename: 'x.pdf',
        contentType: 'application/pdf',
        sha256: VALID_SHA256, // same content
      },
      deps,
    )
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error('unreachable')
    expect(second.outcome).toBe('duplicate_sha256')
    // The duplicate-result returns the ORIGINAL document.
    expect(second.document.id).toBe('doc_first')
  })

  it('records uploadedBy=staff when an actor is supplied', async () => {
    const deps = makeCompleteDeps({
      actor: { id: 'stf_42', role: 'analyst' },
    })
    const result = await completeUpload(
      {
        caseId: 'cas_abc',
        documentId: 'doc_a',
        storageKey: 'cases/cas_abc/doc_a/notes.pdf',
        filename: 'notes.pdf',
        contentType: 'application/pdf',
        sha256: ANOTHER_SHA256,
      },
      deps,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.document.uploadedBy).toBe('staff')
    expect(result.document.uploadedByActorId).toBe('stf_42')
  })
})
