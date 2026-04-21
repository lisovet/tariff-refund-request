// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CaseSidePanel } from '../CaseSidePanel'
import type { CaseDocumentSummary } from '../DocumentViewerPanel'

const DOCS: CaseDocumentSummary[] = [
  { id: 'd1', filename: 'invoice_01.pdf', storageKey: 'cases/cas/d1/invoice_01.pdf' },
  { id: 'd2', filename: 'ace_query.pdf', storageKey: 'cases/cas/d2/ace_query.pdf' },
]

describe('CaseSidePanel — tabbed right-pane (Docs / Audit)', () => {
  it('defaults to the Documents tab', () => {
    render(<CaseSidePanel caseId="cas_x" documents={DOCS} />)
    expect(screen.getByTestId('tab-docs-panel')).toBeTruthy()
    expect(screen.queryByTestId('tab-audit-panel')).toBeNull()
  })

  it('renders both tabs (Documents + Audit)', () => {
    render(<CaseSidePanel caseId="cas_x" documents={DOCS} />)
    expect(screen.getByRole('tab', { name: /documents/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /audit/i })).toBeTruthy()
  })

  it('switches to the Audit tab on click and shows the empty-audit state', () => {
    render(<CaseSidePanel caseId="cas_x" documents={DOCS} />)
    fireEvent.click(screen.getByRole('tab', { name: /audit/i }))
    expect(screen.getByTestId('tab-audit-panel')).toBeTruthy()
    // With no auditEntries prop, the timeline renders its
    // "No audit events yet" empty state.
    expect(screen.getByText(/no audit events yet/i)).toBeTruthy()
  })

  it('Documents tab shows the provided documents', () => {
    render(<CaseSidePanel caseId="cas_x" documents={DOCS} />)
    expect(screen.getByText('invoice_01.pdf')).toBeTruthy()
    expect(screen.getByText('ace_query.pdf')).toBeTruthy()
  })

  it('Documents tab shows an empty state when no docs attached', () => {
    render(<CaseSidePanel caseId="cas_x" documents={[]} />)
    // DocumentViewerPanel's own empty-state wording — asserted
    // structurally via the testid so a copy tweak doesn't break
    // the tab integration test.
    expect(screen.getByTestId('ops-doc-viewer-empty')).toBeTruthy()
  })

  it('Audit tab renders even when Documents is empty (tab independence)', () => {
    render(<CaseSidePanel caseId="cas_x" documents={[]} />)
    fireEvent.click(screen.getByRole('tab', { name: /audit/i }))
    expect(screen.getByTestId('tab-audit-panel')).toBeTruthy()
  })
})
