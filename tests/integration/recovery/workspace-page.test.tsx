// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

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

import RecoveryWorkspacePage from '@/app/(app)/app/case/[id]/recovery/page'

const FIXTURE_CASE = {
  id: 'cas_test',
  state: 'awaiting_docs' as const,
  tier: 'smb' as const,
  customerId: null,
  screenerSessionId: 'ses_test',
  ownerStaffId: null,
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
    q4: 'broker', // → recoveryPath = 'broker'
    q10: { company: 'Acme Imports LLC', email: 'imports@acme.test' },
  },
  result: null,
  resultVersion: null,
  createdAt: new Date('2026-04-21T09:00:00Z'),
  updatedAt: new Date('2026-04-21T09:30:00Z'),
}

async function renderPage(id: string) {
  const element = await RecoveryWorkspacePage({
    params: Promise.resolve({ id }),
  })
  return render(element)
}

describe('/app/case/[id]/recovery — happy path (broker)', () => {
  it('renders the three panes wired to the broker recovery plan', async () => {
    mocks.findCase.mockResolvedValueOnce(FIXTURE_CASE)
    mocks.findSessionById.mockResolvedValueOnce(FIXTURE_SESSION)
    mocks.listDocumentsForCase.mockResolvedValueOnce([])

    await renderPage('cas_test')

    // Left pane: case id + status banner with broker label.
    expect(screen.getByTestId('case-id').textContent).toBe('cas_test')
    expect(screen.getByTestId('status-banner').textContent).toMatch(/broker recovery/i)

    // Center pane: outreach kit with importerName substituted, no
    // unreplaced {{placeholders}}.
    const subject = screen.getByTestId('email-subject')
    const body = screen.getByTestId('email-body')
    expect(subject.textContent).not.toMatch(/\{\{[^}]+\}\}/)
    expect(body.textContent).not.toMatch(/\{\{[^}]+\}\}/)
    expect(body.textContent).toContain('Acme Imports LLC')

    // Right pane: upload zone heading present.
    expect(screen.getByText(/upload documents/i)).toBeInTheDocument()
  })

  it('lists uploaded documents in the left pane when present', async () => {
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
    const list = screen.getByTestId('uploaded-list')
    expect(within(list).getByText('broker-7501.pdf')).toBeInTheDocument()
  })
})

describe('/app/case/[id]/recovery — not-found paths', () => {
  it('404s when the case does not exist', async () => {
    mocks.findCase.mockResolvedValueOnce(undefined)
    await expect(renderPage('cas_missing')).rejects.toThrow(/NEXT_NOT_FOUND/)
    expect(mocks.notFound).toHaveBeenCalled()
  })

  it('404s when the case has no resolvable recovery path (no screener session)', async () => {
    mocks.findCase.mockResolvedValueOnce({ ...FIXTURE_CASE, screenerSessionId: null })
    await expect(renderPage('cas_test')).rejects.toThrow(/NEXT_NOT_FOUND/)
  })

  it('404s when the screener result is disqualified', async () => {
    mocks.findCase.mockResolvedValueOnce(FIXTURE_CASE)
    mocks.findSessionById.mockResolvedValueOnce({
      ...FIXTURE_SESSION,
      answers: { ...FIXTURE_SESSION.answers, q1: 'no' },
    })
    await expect(renderPage('cas_test')).rejects.toThrow(/NEXT_NOT_FOUND/)
  })
})
