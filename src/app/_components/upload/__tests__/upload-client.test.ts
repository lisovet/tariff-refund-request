// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { uploadFile, type UploadDeps, type UploadProgress } from '../upload-client'

const VALID_SHA = 'a'.repeat(64)

function makeDeps(overrides: Partial<UploadDeps> = {}): UploadDeps {
  return {
    fetchFn: vi.fn(),
    hashFile: vi.fn(async () => VALID_SHA),
    putToBucket: vi.fn(async () => ({ ok: true })),
    ...overrides,
  }
}

function makeFile(
  name = 'export.xlsx',
  type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  size = 1234,
): File {
  return new File([new Uint8Array(size)], name, { type })
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
    ...init,
  })
}

describe('uploadFile — happy path', () => {
  it('hashes, prepares, PUTs, then completes — emits queued→hashing→uploading→completed', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/uploads')) {
        return jsonResponse({
          documentId: 'doc_x',
          storageKey: 'cases/cas_a/doc_x/export.xlsx',
          uploadUrl: 'https://r2.test/put',
          expiresInSeconds: 900,
        })
      }
      if (url.endsWith('/api/uploads/complete')) {
        return jsonResponse({
          outcome: 'created',
          document: {
            id: 'doc_x',
            caseId: 'cas_a',
            storageKey: 'cases/cas_a/doc_x/export.xlsx',
            filename: 'export.xlsx',
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            byteSize: 1234,
            sha256: VALID_SHA,
            uploadedBy: 'customer',
            createdAt: '2026-04-21T11:00:00Z',
          },
        })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

    const deps = makeDeps({ fetchFn })
    const events: UploadProgress[] = []

    const result = await uploadFile(
      { caseId: 'cas_a', file: makeFile() },
      deps,
      (e) => events.push(e),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.outcome).toBe('created')
    expect(result.document.id).toBe('doc_x')

    const stages = events.map((e) => e.stage)
    // 'uploading' is emitted twice (fraction 0 → fraction 1) so the
    // UI can render a slim progress bar that fills as the PUT lands.
    expect(stages).toEqual([
      'queued',
      'hashing',
      'uploading',
      'uploading',
      'completing',
      'completed',
    ])
  })

  it('passes the right body shape to /api/uploads', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/uploads')) {
        const body = JSON.parse(String(init?.body)) as {
          caseId: string
          filename: string
          contentType: string
          byteSize: number
        }
        expect(body).toEqual({
          caseId: 'cas_a',
          filename: 'export.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          byteSize: 1234,
        })
        return jsonResponse({
          documentId: 'doc_x',
          storageKey: 'cases/cas_a/doc_x/export.xlsx',
          uploadUrl: 'https://r2.test/put',
          expiresInSeconds: 900,
        })
      }
      return jsonResponse({
        outcome: 'created',
        document: {
          id: 'doc_x',
          caseId: 'cas_a',
          storageKey: 'cases/cas_a/doc_x/export.xlsx',
          filename: 'export.xlsx',
          contentType: 'application/pdf',
          byteSize: 1234,
          sha256: VALID_SHA,
          uploadedBy: 'customer',
          createdAt: '2026-04-21T11:00:00Z',
        },
      })
    })

    const deps = makeDeps({ fetchFn })
    await uploadFile({ caseId: 'cas_a', file: makeFile() }, deps)
    expect(fetchFn).toHaveBeenCalled()
  })
})

describe('uploadFile — failure modes', () => {
  it('returns prepare_failed when /api/uploads returns 4xx', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ error: 'byte_size_too_large' }, { status: 413 }),
    )
    const deps = makeDeps({ fetchFn })
    const result = await uploadFile({ caseId: 'cas_a', file: makeFile() }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.stage).toBe('prepare')
    expect(result.error).toBe('byte_size_too_large')
  })

  it('returns put_failed when the bucket PUT errors', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({
        documentId: 'doc_x',
        storageKey: 'cases/cas_a/doc_x/export.xlsx',
        uploadUrl: 'https://r2.test/put',
        expiresInSeconds: 900,
      }),
    )
    const deps = makeDeps({
      fetchFn,
      putToBucket: vi.fn(async () => ({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      })),
    })
    const result = await uploadFile({ caseId: 'cas_a', file: makeFile() }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.stage).toBe('put')
    expect(result.error).toMatch(/403/)
  })

  it('returns complete_failed when /api/uploads/complete returns 4xx', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/uploads')) {
        return jsonResponse({
          documentId: 'doc_x',
          storageKey: 'cases/cas_a/doc_x/export.xlsx',
          uploadUrl: 'https://r2.test/put',
          expiresInSeconds: 900,
        })
      }
      return jsonResponse({ error: 'object_not_uploaded' }, { status: 409 })
    })
    const deps = makeDeps({ fetchFn })
    const result = await uploadFile({ caseId: 'cas_a', file: makeFile() }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.stage).toBe('complete')
    expect(result.error).toBe('object_not_uploaded')
  })

  it('emits a failed progress event on any failure path', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ error: 'content_type_unsupported' }, { status: 415 }),
    )
    const deps = makeDeps({ fetchFn })
    const events: UploadProgress[] = []
    await uploadFile({ caseId: 'cas_a', file: makeFile() }, deps, (e) =>
      events.push(e),
    )
    expect(events.at(-1)?.stage).toBe('failed')
  })
})
