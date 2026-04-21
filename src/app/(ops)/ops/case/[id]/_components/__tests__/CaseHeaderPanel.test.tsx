// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { recoveryPlanFor } from '@contexts/recovery'
import type { CaseRecord } from '@contexts/ops'
import { CaseHeaderPanel } from '../CaseHeaderPanel'

const FIXTURE: CaseRecord = {
  id: 'cas_test',
  state: 'awaiting_docs',
  tier: 'smb',
  customerId: null,
  screenerSessionId: 'ses_x',
  ownerStaffId: 'stf_42',
  createdAt: new Date('2026-04-21T09:00:00Z'),
  updatedAt: new Date('2026-04-21T10:00:00Z'),
}

describe('CaseHeaderPanel', () => {
  it('renders case id, tier, owner, and queue', () => {
    render(
      <CaseHeaderPanel
        caseRecord={FIXTURE}
        plan={recoveryPlanFor('broker')}
      />,
    )
    expect(screen.getByTestId('case-id').textContent).toBe('cas_test')
    expect(screen.getByTestId('case-tier').textContent).toBe('SMB')
    expect(screen.getByTestId('case-path').textContent).toBe('BROKER')
    expect(screen.getByTestId('case-owner').textContent).toBe('stf_42')
    expect(screen.getByTestId('case-queue').textContent).toBe('recovery-broker')
  })

  it('renders the state pill with a data-state attribute the CSS can target', () => {
    render(
      <CaseHeaderPanel
        caseRecord={FIXTURE}
        plan={recoveryPlanFor('broker')}
      />,
    )
    const pill = screen.getByTestId('state-pill')
    expect(pill.getAttribute('data-state')).toBe('awaiting_docs')
    expect(pill.textContent).toBe('AWAITING DOCS')
  })

  it('renders SLA hours from the recovery plan in mono', () => {
    render(
      <CaseHeaderPanel
        caseRecord={FIXTURE}
        plan={recoveryPlanFor('carrier')}
      />,
    )
    expect(screen.getByTestId('sla-first-touch').textContent).toBe('4h')
    expect(screen.getByTestId('sla-completion').textContent).toBe('48h')
  })

  it('shows action panel with claim + stall stubs', () => {
    render(
      <CaseHeaderPanel
        caseRecord={FIXTURE}
        plan={recoveryPlanFor('broker')}
      />,
    )
    expect(screen.getByTestId('action-claim')).toBeInTheDocument()
    expect(screen.getByTestId('action-stall')).toBeInTheDocument()
  })

  it('shows owner as em-dash when unclaimed', () => {
    render(
      <CaseHeaderPanel
        caseRecord={{ ...FIXTURE, ownerStaffId: null }}
        plan={recoveryPlanFor('broker')}
      />,
    )
    expect(screen.getByTestId('case-owner').textContent).toBe('—')
  })
})
