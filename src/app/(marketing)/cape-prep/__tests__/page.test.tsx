// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CapePrepPage from '../page'

describe('/cape-prep', () => {
  it('renders the editorial H1 in the display face', () => {
    render(<CapePrepPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/turn entries into a file your broker can submit/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the three validator severity bands', () => {
    render(<CapePrepPage />)
    expect(screen.getByText('Blocking')).toBeTruthy()
    expect(screen.getByText('Warning')).toBeTruthy()
    expect(screen.getByText('Info')).toBeTruthy()
  })

  it('renders pricing rows for both CAPE Prep SKUs with mono dollar figures', () => {
    render(<CapePrepPage />)
    const standard = document.querySelector('[data-sku="cape_prep_standard"]')
    expect(standard).toBeTruthy()
    const stdPrice = standard?.querySelector('[data-price-mono]')
    expect(stdPrice?.textContent).toMatch(/\$\d/)
    expect(stdPrice?.className).toMatch(/font-mono/)

    expect(document.querySelector('[data-sku="cape_prep_premium"]')).toBeTruthy()
  })

  it('primary + closing CTAs both link to /screener', () => {
    render(<CapePrepPage />)
    const ctas = screen.getAllByRole('link', { name: /check eligibility/i })
    expect(ctas.length).toBeGreaterThanOrEqual(2)
    for (const c of ctas) {
      expect(c.getAttribute('href')).toBe('/screener')
    }
  })
})
