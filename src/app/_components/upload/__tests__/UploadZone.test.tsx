// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UploadZone } from '../UploadZone'

const VALID_SHA = 'a'.repeat(64)

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
    ...init,
  })
}

function makeFile(
  name = 'export.xlsx',
  type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  size = 1234,
): File {
  return new File([new Uint8Array(size)], name, { type })
}

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type PutFn = (
  url: string,
  file: File,
  contentType: string,
) => Promise<{ ok: boolean; status?: number; statusText?: string }>

function happyFetch(): FetchFn {
  return vi.fn<FetchFn>(async (input) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/api/uploads')) {
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
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        byteSize: 1234,
        sha256: VALID_SHA,
        uploadedBy: 'customer',
        createdAt: '2026-04-21T11:00:00Z',
      },
    })
  })
}

function makeClient(overrides?: { fetchFn?: FetchFn; putToBucket?: PutFn }) {
  return {
    fetchFn: overrides?.fetchFn ?? happyFetch(),
    hashFile: vi.fn(async () => VALID_SHA),
    putToBucket: overrides?.putToBucket ?? vi.fn<PutFn>(async () => ({ ok: true })),
  }
}

describe('UploadZone — render', () => {
  it('renders the dropzone heading + accepted-types caption', () => {
    render(<UploadZone caseId="cas_a" />)
    expect(screen.getByText(/upload documents/i)).toBeInTheDocument()
    expect(screen.getByText(/PDF · XLSX · XLS · CSV · EML/)).toBeInTheDocument()
  })

  it('renders no queue rows initially', () => {
    render(<UploadZone caseId="cas_a" />)
    expect(screen.queryByTestId('upload-queue')).toBeNull()
  })
})

describe('UploadZone — pre-validation (no network call)', () => {
  it('rejects unsupported content types before calling the network', () => {
    const client = makeClient()
    render(<UploadZone caseId="cas_a" client={client} />)

    const input = screen.getByTestId('upload-input') as HTMLInputElement
    const bad = new File([new Uint8Array(10)], 'malware.bin', {
      type: 'application/x-shellscript',
    })
    fireEvent.change(input, { target: { files: [bad] } })

    const row = screen.getByTestId('upload-row')
    expect(within(row).getByTestId('upload-status').textContent).toBe('Failed')
    expect(within(row).getByText(/Unsupported file type/)).toBeInTheDocument()
    expect(client.fetchFn).not.toHaveBeenCalled()
  })

  it('rejects oversized files before calling the network', () => {
    const client = makeClient()
    render(<UploadZone caseId="cas_a" client={client} />)
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    const big = new File([new Uint8Array(60 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(input, { target: { files: [big] } })
    const row = screen.getByTestId('upload-row')
    expect(within(row).getByText(/File exceeds \d+ MB/)).toBeInTheDocument()
    expect(client.fetchFn).not.toHaveBeenCalled()
  })
})

describe('UploadZone — happy path', () => {
  it('uploads a single file end-to-end and renders Uploaded status', async () => {
    const client = makeClient()
    const onUploaded = vi.fn()
    render(
      <UploadZone caseId="cas_a" client={client} onUploaded={onUploaded} />,
    )
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile()] } })

    await waitFor(() => {
      expect(screen.getByTestId('upload-status').textContent).toBe('Uploaded')
    })

    expect(client.fetchFn).toHaveBeenCalledTimes(2) // /api/uploads + /api/uploads/complete
    expect(client.putToBucket).toHaveBeenCalledTimes(1)
    expect(onUploaded).toHaveBeenCalledTimes(1)
  })

  it('handles multiple files in a single drop', async () => {
    const client = makeClient()
    render(<UploadZone caseId="cas_a" client={client} />)
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, {
      target: {
        files: [
          makeFile('a.pdf', 'application/pdf'),
          makeFile('b.csv', 'text/csv'),
        ],
      },
    })
    await waitFor(() => {
      const statuses = screen.getAllByTestId('upload-status').map((n) => n.textContent)
      expect(statuses).toEqual(['Uploaded', 'Uploaded'])
    })
  })
})

describe('UploadZone — failure + retry', () => {
  it('shows Failed + Retry on a network error and recovers on retry', async () => {
    let calls = 0
    const fetchFn = vi.fn<FetchFn>(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/uploads')) {
        calls++
        if (calls === 1) {
          return jsonResponse({ error: 'object_not_uploaded' }, { status: 503 })
        }
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
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          byteSize: 1234,
          sha256: VALID_SHA,
          uploadedBy: 'customer',
          createdAt: '2026-04-21T11:00:00Z',
        },
      })
    })

    const client = makeClient({ fetchFn })
    render(<UploadZone caseId="cas_a" client={client} />)
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile()] } })

    await waitFor(() => {
      expect(screen.getByTestId('upload-status').textContent).toBe('Failed')
    })
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(screen.getByTestId('upload-status').textContent).toBe('Uploaded')
    })
  })

  it('marks duplicate_sha256 as Duplicate, not Uploaded', async () => {
    const fetchFn = vi.fn<FetchFn>(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/uploads')) {
        return jsonResponse({
          documentId: 'doc_x',
          storageKey: 'cases/cas_a/doc_x/export.xlsx',
          uploadUrl: 'https://r2.test/put',
          expiresInSeconds: 900,
        })
      }
      return jsonResponse({
        outcome: 'duplicate_sha256',
        document: {
          id: 'doc_existing',
          caseId: 'cas_a',
          storageKey: 'cases/cas_a/doc_existing/export.xlsx',
          filename: 'export.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          byteSize: 1234,
          sha256: VALID_SHA,
          uploadedBy: 'customer',
          createdAt: '2026-04-21T11:00:00Z',
        },
      })
    })
    const client = makeClient({ fetchFn })
    render(<UploadZone caseId="cas_a" client={client} />)
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile()] } })
    await waitFor(() => {
      expect(screen.getByTestId('upload-status').textContent).toBe('Duplicate')
    })
  })
})

describe('UploadZone — drag-drop', () => {
  it('accepts a drop event with files', async () => {
    const client = makeClient()
    render(<UploadZone caseId="cas_a" client={client} />)
    const dropzone = screen.getByTestId('upload-dropzone')
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile()] },
    })
    await waitFor(() => {
      expect(screen.getByTestId('upload-status').textContent).toBe('Uploaded')
    })
  })
})
