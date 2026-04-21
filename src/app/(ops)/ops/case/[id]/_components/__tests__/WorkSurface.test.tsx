// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkSurface } from '../WorkSurface'
import type { CaseState } from '@contexts/ops'

const FIXTURE_CASE_ID = 'cas_ws_1'

function renderAt(state: CaseState) {
  render(<WorkSurface caseId={FIXTURE_CASE_ID} state={state} />)
}

describe('WorkSurface — state-adaptive center pane', () => {
  it('renders the extraction form when the case is in entry-recovery', () => {
    renderAt('entry_recovery_in_progress')
    expect(screen.getByTestId('surface-extraction')).toBeTruthy()
  })

  it('renders the extraction form when the case is awaiting_docs', () => {
    renderAt('awaiting_docs')
    expect(screen.getByTestId('surface-extraction')).toBeTruthy()
  })

  it('renders the CAPE-prep placeholder when the case is cape_prep_in_progress', () => {
    renderAt('cape_prep_in_progress')
    expect(screen.getByTestId('surface-cape-prep')).toBeTruthy()
    expect(screen.getByText(/CAPE prep/i)).toBeTruthy()
  })

  it('renders the batch-QA surface when the case is in batch_qa', () => {
    renderAt('batch_qa')
    expect(screen.getByTestId('surface-batch-qa')).toBeTruthy()
    expect(screen.getByText(/validator sign-off/i)).toBeTruthy()
  })

  it('renders the submission-ready surface once signed off', () => {
    renderAt('submission_ready')
    expect(screen.getByTestId('surface-submission-ready')).toBeTruthy()
    expect(screen.getByText(/ready for filing/i)).toBeTruthy()
  })

  it('renders the entry-list surface when entries are ready', () => {
    renderAt('entry_list_ready')
    expect(screen.getByTestId('surface-entry-list')).toBeTruthy()
  })

  it('renders a read-only summary on terminal states', () => {
    renderAt('closed')
    expect(screen.getByTestId('surface-terminal')).toBeTruthy()
    renderAt('paid')
    expect(screen.getAllByTestId('surface-terminal').length).toBeGreaterThan(0)
    renderAt('disqualified')
    expect(screen.getAllByTestId('surface-terminal').length).toBeGreaterThan(0)
  })

  it('renders the fallback placeholder for intake / pre-purchase states', () => {
    renderAt('new_lead')
    expect(screen.getByTestId('surface-placeholder')).toBeTruthy()
    renderAt('qualified')
    expect(screen.getAllByTestId('surface-placeholder').length).toBeGreaterThan(0)
    renderAt('awaiting_purchase')
    expect(screen.getAllByTestId('surface-placeholder').length).toBeGreaterThan(0)
  })

  it('always renders an eyebrow with the state for orientation', () => {
    renderAt('batch_qa')
    expect(screen.getByText('batch_qa')).toBeTruthy()
  })
})
