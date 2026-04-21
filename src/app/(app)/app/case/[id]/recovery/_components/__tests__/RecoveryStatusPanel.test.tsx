// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { recoveryPlanFor } from '@contexts/recovery'
import { RecoveryStatusPanel, type UploadedDocSummary } from '../RecoveryStatusPanel'

describe('RecoveryStatusPanel', () => {
  it('renders the case id in mono', () => {
    render(
      <RecoveryStatusPanel
        caseId="cas_abc123"
        plan={recoveryPlanFor('broker')}
        uploaded={[]}
      />,
    )
    expect(screen.getByTestId('case-id').textContent).toBe('cas_abc123')
  })

  it('shows the path label + SLA hours in the status banner', () => {
    render(
      <RecoveryStatusPanel
        caseId="cas_x"
        plan={recoveryPlanFor('carrier')}
        uploaded={[]}
      />,
    )
    const banner = screen.getByTestId('status-banner')
    expect(banner.textContent).toMatch(/carrier recovery/i)
    expect(banner.textContent).toMatch(/4h/) // first-touch SLA
  })

  it('renders one checklist row per accepted document kind', () => {
    const plan = recoveryPlanFor('broker')
    render(
      <RecoveryStatusPanel caseId="cas_x" plan={plan} uploaded={[]} />,
    )
    for (const kind of plan.acceptedDocs) {
      expect(
        screen.getByTestId(`checklist-row-${kind}`),
      ).toBeInTheDocument()
    }
  })

  it('renders prerequisite rows tagged required vs optional', () => {
    render(
      <RecoveryStatusPanel
        caseId="cas_x"
        plan={recoveryPlanFor('ace-self-export')}
        uploaded={[]}
      />,
    )
    const aceRow = screen.getByTestId('prereq-ace_account')
    expect(aceRow.getAttribute('data-required')).toBe('true')
    expect(within(aceRow).getByText(/required/i)).toBeInTheDocument()
  })

  it('hides the uploaded list when no documents are present', () => {
    render(
      <RecoveryStatusPanel
        caseId="cas_x"
        plan={recoveryPlanFor('broker')}
        uploaded={[]}
      />,
    )
    expect(screen.queryByTestId('uploaded-list')).toBeNull()
  })

  it('renders the uploaded list when documents are present', () => {
    const uploaded: UploadedDocSummary[] = [
      { id: 'doc_1', filename: 'broker.7501.pdf', uploadedAtIso: '2026-04-21T10:00:00.000Z' },
      { id: 'doc_2', filename: 'spreadsheet.xlsx', uploadedAtIso: '2026-04-21T11:00:00.000Z' },
    ]
    render(
      <RecoveryStatusPanel
        caseId="cas_x"
        plan={recoveryPlanFor('broker')}
        uploaded={uploaded}
      />,
    )
    const list = screen.getByTestId('uploaded-list')
    expect(within(list).getByText('broker.7501.pdf')).toBeInTheDocument()
    expect(within(list).getByText('spreadsheet.xlsx')).toBeInTheDocument()
  })
})
