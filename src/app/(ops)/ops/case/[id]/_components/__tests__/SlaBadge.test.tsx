// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SlaBadge } from '../SlaBadge'

const H = 60 * 60 * 1000

describe('SlaBadge', () => {
  it('renders an ok badge for an in-SLA case', () => {
    render(<SlaBadge state="batch_qa" ageMs={1 * H} />)
    expect(screen.getByTestId('sla-badge').getAttribute('data-band')).toBe('ok')
    expect(screen.getByText(/23h/)).toBeTruthy()
    expect(screen.getByText(/on track/i)).toBeTruthy()
  })

  it('renders a warning badge when elapsed crosses the 80% threshold', () => {
    render(<SlaBadge state="batch_qa" ageMs={21 * H} />)
    expect(screen.getByTestId('sla-badge').getAttribute('data-band')).toBe('warning')
    expect(screen.getByText(/3h/)).toBeTruthy()
  })

  it('renders a breach badge with "overdue" label when past target', () => {
    render(<SlaBadge state="batch_qa" ageMs={30 * H} />)
    expect(screen.getByTestId('sla-badge').getAttribute('data-band')).toBe('breach')
    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0)
  })

  it('renders a no-SLA placeholder on terminal states', () => {
    render(<SlaBadge state="closed" ageMs={100 * H} />)
    expect(screen.getByTestId('sla-badge').getAttribute('data-band')).toBe('none')
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByText(/not applicable/i)).toBeTruthy()
  })
})
