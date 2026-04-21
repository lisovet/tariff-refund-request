// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeAntiPositioning } from '../HomeAntiPositioning'

describe('<HomeAntiPositioning>', () => {
  it('renders the canonical "What we are not" headline', () => {
    render(<HomeAntiPositioning />)
    expect(
      screen.getByRole('heading', { name: /What we are not/i }),
    ).toBeTruthy()
  })

  it('lists each non-goal as a real list item (not a banner)', () => {
    render(<HomeAntiPositioning />)
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeGreaterThanOrEqual(5)
    const text = items.map((li) => li.textContent ?? '').join(' | ')
    expect(text).toMatch(/customs broker/i)
    expect(text).toMatch(/legal advice/i)
    expect(text).toMatch(/auto.*submit/i)
  })
})
