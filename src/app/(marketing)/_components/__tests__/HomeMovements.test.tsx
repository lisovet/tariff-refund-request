// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeMovements } from '../HomeMovements'

describe('<HomeMovements>', () => {
  it('renders the three canonical movements in funnel order', () => {
    render(<HomeMovements />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual([
      'Recovery',
      'Filing prep',
      'Concierge',
    ])
  })

  it('renders prices in the mono face (Berkeley Mono fallback chain)', () => {
    render(<HomeMovements />)
    const prices = screen.getAllByText(/\$\d/)
    expect(prices.length).toBeGreaterThanOrEqual(3)
    prices.forEach((el) => expect(el.className).toMatch(/font-mono/))
  })
})
