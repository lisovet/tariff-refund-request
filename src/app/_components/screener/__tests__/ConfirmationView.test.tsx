// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfirmationView } from '../ConfirmationView'

// next/navigation's useSearchParams throws outside an app-router tree.
const paramsMap = new Map<string, string>()
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => paramsMap.get(key) ?? null,
  }),
}))

function withTier(value: string | undefined) {
  paramsMap.clear()
  if (value !== undefined) paramsMap.set('tier', value)
}

describe('<ConfirmationView>', () => {
  it('renders the headline', () => {
    withTier('full_prep')
    render(<ConfirmationView />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(
      /specialist will be in touch within 24 hours/i,
    )
  })

  it('full_prep renders a 4-step next-steps list', () => {
    withTier('full_prep')
    render(<ConfirmationView />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(screen.getByText(/account manager reaches out/i)).toBeTruthy()
    expect(screen.getByText(/document checklist/i)).toBeTruthy()
    expect(screen.getByText(/Readiness Report/i)).toBeTruthy()
  })

  it('audit renders a shorter 2-step list', () => {
    withTier('audit')
    render(<ConfirmationView />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('falls back to audit copy for unknown / missing tier', () => {
    withTier('bogus')
    render(<ConfirmationView />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    withTier(undefined)
    render(<ConfirmationView />)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
  })

  it('does not claim we submit to CBP', () => {
    withTier('full_prep')
    render(<ConfirmationView />)
    expect(screen.queryByText(/we submit/i)).toBeNull()
    expect(screen.queryByText(/file with CBP/i)).toBeNull()
  })

  it('tells the user an automated homework email is coming', () => {
    withTier('full_prep')
    render(<ConfirmationView />)
    expect(screen.getByText(/automated email/i)).toBeTruthy()
    expect(screen.getByText(/head start/i)).toBeTruthy()
  })

  it('renders the canonical trust promise footer', () => {
    withTier('full_prep')
    render(<ConfirmationView />)
    expect(
      screen.getByText(/We help prepare your refund file/i),
    ).toBeTruthy()
  })
})
