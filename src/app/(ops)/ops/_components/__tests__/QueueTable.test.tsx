// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueueTable } from '../QueueTable'
import type { QueueRow } from '@contexts/ops'

const ROW_A: QueueRow = {
  id: 'cas_a1',
  state: 'batch_qa',
  tier: 'smb',
  ownerStaffId: 'stf_mina',
  ageMs: 2 * 60 * 60 * 1000,
  ageHumanized: '2h',
  isSlaBreach: false,
  updatedAtIso: '2026-04-21T12:00:00.000Z',
}

const ROW_BREACH: QueueRow = {
  id: 'cas_b2',
  state: 'new_lead',
  tier: 'mid_market',
  ownerStaffId: null,
  ageMs: 30 * 60 * 60 * 1000,
  ageHumanized: '1d',
  isSlaBreach: true,
  updatedAtIso: '2026-04-20T08:00:00.000Z',
}

describe('QueueTable', () => {
  it('renders a header row with the queue-critical columns', () => {
    render(<QueueTable rows={[ROW_A]} />)
    expect(screen.getByText('Case')).toBeTruthy()
    expect(screen.getByText('State')).toBeTruthy()
    expect(screen.getByText('Tier')).toBeTruthy()
    expect(screen.getByText('Owner')).toBeTruthy()
    expect(screen.getByText('Age')).toBeTruthy()
  })

  it('renders one row per case and links to /ops/case/[id]', () => {
    render(<QueueTable rows={[ROW_A, ROW_BREACH]} />)
    const linkA = screen.getByRole('link', { name: 'cas_a1' })
    expect(linkA.getAttribute('href')).toBe('/ops/case/cas_a1')
    const linkB = screen.getByRole('link', { name: 'cas_b2' })
    expect(linkB.getAttribute('href')).toBe('/ops/case/cas_b2')
  })

  it('marks SLA breaches on the row for a visible/accessible signal', () => {
    render(<QueueTable rows={[ROW_A, ROW_BREACH]} />)
    const breachRow = screen
      .getByTestId('queue-table')
      .querySelector('tr[data-case-id="cas_b2"]')
    expect(breachRow?.getAttribute('data-sla-breach')).toBe('true')
    expect(screen.getByText('SLA')).toBeTruthy()
  })

  it('renders "unassigned" for rows with no owner', () => {
    render(<QueueTable rows={[ROW_BREACH]} />)
    expect(screen.getByText('unassigned')).toBeTruthy()
  })

  it('renders an empty-state message when no rows', () => {
    render(<QueueTable rows={[]} />)
    expect(screen.getByText(/Queue empty/i)).toBeTruthy()
  })
})
