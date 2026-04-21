// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findCase: vi.fn(),
  findSessionById: vi.fn(),
  listDocumentsForCase: vi.fn(),
  notFound: vi.fn(() => {
    const err = new Error('NEXT_NOT_FOUND')
    Object.assign(err, { digest: 'NEXT_NOT_FOUND' })
    throw err
  }),
}))

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}))

vi.mock('@contexts/ops/server', () => ({
  getCaseRepo: () => ({ findCase: mocks.findCase }),
}))

vi.mock('@contexts/screener/server', () => ({
  getScreenerRepo: () => ({ findSessionById: mocks.findSessionById }),
}))

vi.mock('@contexts/recovery/server', () => ({
  getDocumentRepo: () => ({ listDocumentsForCase: mocks.listDocumentsForCase }),
}))

// Stub the inner DocumentViewer (jsdom can't render real PDFs).
vi.mock('@/app/_components/document-viewer/DocumentViewer', () => ({
  DocumentViewer: ({ src }: { src: string }) => (
    <div data-testid="stub-viewer" data-src={src}>
      stub-viewer
    </div>
  ),
}))

import OpsCasePage from '@/app/(ops)/ops/case/[id]/page'

const FIXTURE_CASE = {
  id: 'cas_test',
  state: 'awaiting_docs' as const,
  tier: 'smb' as const,
  customerId: null,
  screenerSessionId: 'ses_test',
  ownerStaffId: 'stf_42',
  createdAt: new Date('2026-04-21T10:00:00Z'),
  updatedAt: new Date('2026-04-21T10:00:00Z'),
}

const FIXTURE_SESSION = {
  id: 'ses_test',
  startedAt: new Date('2026-04-21T09:00:00Z'),
  completedAt: new Date('2026-04-21T09:30:00Z'),
  answers: {
    q1: 'yes',
    q3: 'yes',
    q4: 'broker',
    q10: { company: 'Acme Imports LLC', email: 'imports@acme.test' },
  },
  result: null,
  resultVersion: null,
  createdAt: new Date('2026-04-21T09:00:00Z'),
  updatedAt: new Date('2026-04-21T09:30:00Z'),
}

async function renderPage(id: string) {
  const element = await OpsCasePage({ params: Promise.resolve({ id }) })
  return render(element)
}

describe('/ops/case/[id] — happy path', () => {
  it('renders all three panes wired to the case + plan + documents', async () => {
    mocks.findCase.mockResolvedValueOnce(FIXTURE_CASE)
    mocks.findSessionById.mockResolvedValueOnce(FIXTURE_SESSION)
    mocks.listDocumentsForCase.mockResolvedValueOnce([
      {
        id: 'doc_1',
        caseId: 'cas_test',
        storageKey: 'cases/cas_test/doc_1/x.pdf',
        filename: 'broker-7501.pdf',
        contentType: 'application/pdf',
        byteSize: 12_345,
        sha256: 'a'.repeat(64),
        uploadedBy: 'customer',
        uploadedByActorId: null,
        version: 1,
        supersedesId: null,
        createdAt: new Date('2026-04-21T11:00:00Z'),
      },
    ])

    await renderPage('cas_test')

    // Left pane
    expect(screen.getByTestId('case-id').textContent).toBe('cas_test')
    expect(screen.getByTestId('state-pill').textContent).toBe('AWAITING DOCS')
    expect(screen.getByTestId('case-path').textContent).toBe('BROKER')

    // Center pane
    expect(screen.getByTestId('extraction-case-id').textContent).toBe('cas_test')

    // Right pane — document list + stub viewer
    expect(screen.getByTestId('ops-doc-row-doc_1')).toBeInTheDocument()
    expect(screen.getByTestId('stub-viewer').getAttribute('data-src')).toContain('doc_1')
  })
})

describe('/ops/case/[id] — not-found paths', () => {
  it('404s when the case does not exist', async () => {
    mocks.findCase.mockResolvedValueOnce(undefined)
    await expect(renderPage('cas_missing')).rejects.toThrow(/NEXT_NOT_FOUND/)
  })

  it('404s when the case has no resolvable recovery path', async () => {
    mocks.findCase.mockResolvedValueOnce({ ...FIXTURE_CASE, screenerSessionId: null })
    await expect(renderPage('cas_test')).rejects.toThrow(/NEXT_NOT_FOUND/)
  })
})
