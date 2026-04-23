// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeMovements } from '../HomeMovements'

describe('<HomeMovements>', () => {
  it('renders the two tiers in funnel order', () => {
    render(<HomeMovements />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(['Audit', 'Full Prep & Concierge Service'])
  })

  it('renders prices in the mono face (Berkeley Mono fallback chain)', () => {
    render(<HomeMovements />)
    const prices = screen.getAllByText(/\$\d/)
    expect(prices.length).toBeGreaterThanOrEqual(2)
    prices.forEach((el) => expect(el.className).toMatch(/font-mono/))
  })

  it('does not render the legacy 3-stage names', () => {
    render(<HomeMovements />)
    expect(screen.queryByRole('heading', { level: 3, name: /^Recovery$/ })).toBeNull()
    expect(screen.queryByRole('heading', { level: 3, name: /^Filing prep$/ })).toBeNull()
    expect(screen.queryByRole('heading', { level: 3, name: /^Concierge$/ })).toBeNull()
  })
})
