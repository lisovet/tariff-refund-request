// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DocumentViewerPanel, type CaseDocumentSummary } from '../DocumentViewerPanel'

// Stub the inner DocumentViewer so jsdom doesn't try to load pdfjs.
vi.mock('@/app/_components/document-viewer/DocumentViewer', () => ({
  DocumentViewer: ({ src, className }: { src: string; className?: string }) => (
    <div data-testid="stub-viewer" data-src={src} className={className}>
      stub-viewer
    </div>
  ),
}))

const DOCS: CaseDocumentSummary[] = [
  { id: 'doc_a', filename: 'broker-7501.pdf', storageKey: 'cases/cas_x/doc_a/broker-7501.pdf' },
  { id: 'doc_b', filename: 'spreadsheet.xlsx', storageKey: 'cases/cas_x/doc_b/spreadsheet.xlsx' },
  { id: 'doc_c', filename: 'invoice.pdf', storageKey: 'cases/cas_x/doc_c/invoice.pdf' },
]

describe('DocumentViewerPanel', () => {
  it('renders an empty state when no documents are present', () => {
    render(<DocumentViewerPanel documents={[]} />)
    expect(screen.getByTestId('ops-doc-viewer-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('stub-viewer')).toBeNull()
  })

  it('lists documents and opens the first one by default', () => {
    render(<DocumentViewerPanel documents={DOCS} />)
    expect(screen.getByTestId('stub-viewer').getAttribute('data-src')).toContain('doc_a')
    const list = screen.getByTestId('ops-doc-list')
    expect(list.children.length).toBe(3)
    expect(screen.getByTestId('ops-doc-row-doc_a').getAttribute('data-active')).toBe('true')
  })

  it('clicking a doc row activates it', async () => {
    render(<DocumentViewerPanel documents={DOCS} />)
    const row = screen.getByTestId('ops-doc-row-doc_b')
    fireEvent.click(row.querySelector('button') as HTMLButtonElement)
    await waitFor(() => {
      expect(screen.getByTestId('ops-doc-row-doc_b').getAttribute('data-active')).toBe('true')
    })
    expect(screen.getByTestId('stub-viewer').getAttribute('data-src')).toContain('doc_b')
  })

  it('keyboard j advances to the next doc; k retreats', async () => {
    render(<DocumentViewerPanel documents={DOCS} />)
    const pane = screen.getByTestId('ops-doc-viewer-pane')
    pane.focus()

    fireEvent.keyDown(pane, { key: 'j' })
    await waitFor(() =>
      expect(screen.getByTestId('ops-doc-row-doc_b').getAttribute('data-active')).toBe('true'),
    )

    fireEvent.keyDown(pane, { key: 'j' })
    await waitFor(() =>
      expect(screen.getByTestId('ops-doc-row-doc_c').getAttribute('data-active')).toBe('true'),
    )

    fireEvent.keyDown(pane, { key: 'k' })
    await waitFor(() =>
      expect(screen.getByTestId('ops-doc-row-doc_b').getAttribute('data-active')).toBe('true'),
    )
  })

  it('j stops at the last doc; k stops at the first', async () => {
    render(<DocumentViewerPanel documents={DOCS} />)
    const pane = screen.getByTestId('ops-doc-viewer-pane')
    pane.focus()

    fireEvent.keyDown(pane, { key: 'k' }) // already at index 0
    await waitFor(() =>
      expect(screen.getByTestId('ops-doc-row-doc_a').getAttribute('data-active')).toBe('true'),
    )

    // Advance past the end.
    for (let i = 0; i < 5; i++) fireEvent.keyDown(pane, { key: 'j' })
    await waitFor(() =>
      expect(screen.getByTestId('ops-doc-row-doc_c').getAttribute('data-active')).toBe('true'),
    )
  })
})
