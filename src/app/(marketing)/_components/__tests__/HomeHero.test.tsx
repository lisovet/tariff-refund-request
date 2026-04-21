// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeHero } from '../HomeHero'

describe('<HomeHero>', () => {
  it('renders the canonical headline in the display face', () => {
    render(<HomeHero />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/IEEPA tariff refund/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the subhead in the body face', () => {
    render(<HomeHero />)
    const sub = screen.getByText(/find your entry numbers/i)
    expect(sub.tagName).toBe('P')
  })

  it('renders exactly one accent CTA above the fold', () => {
    // Per docs/DESIGN-LANGUAGE.md: one accent element max above the fold.
    render(<HomeHero />)
    const ctas = screen.getAllByRole('link', { name: /Check eligibility/i })
    expect(ctas).toHaveLength(1)
    expect(ctas[0]?.getAttribute('href')).toBe('/screener')
  })

  it('does not include any banned-aesthetic spectacle (purple, gradient, sparkle)', () => {
    render(<HomeHero />)
    const main = screen.getByRole('banner')
    expect(main.outerHTML).not.toMatch(/purple|gradient|✨|🚀/i)
  })
})
