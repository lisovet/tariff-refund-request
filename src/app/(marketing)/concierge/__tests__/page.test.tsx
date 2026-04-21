// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConciergePage from '../page'

describe('/concierge', () => {
  it('renders the editorial H1 in the display face', () => {
    render(<ConciergePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/hand off the filing/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the concierge_base pricing row with mono dollar figures', () => {
    render(<ConciergePage />)
    const row = document.querySelector('[data-sku="concierge_base"]')
    expect(row).toBeTruthy()
    const price = row?.querySelector('[data-price-mono]')
    expect(price?.textContent).toMatch(/\$\d/)
    expect(price?.className).toMatch(/font-mono/)
  })

  it('renders both SMB + mid-market success-fee percentage bands', () => {
    render(<ConciergePage />)
    // SUCCESS_FEE_RATES are 10-12% (SMB) and 8-10% (mid) at v1; assert
    // two percentage patterns appear somewhere on the page.
    const pctMatches = document.body.textContent?.match(/\d+%/g) ?? []
    expect(pctMatches.length).toBeGreaterThanOrEqual(4)
  })

  it('renders the success-fee hard cap ($50,000) + "only when the refund posts" clause', () => {
    render(<ConciergePage />)
    expect(screen.getByText(/\$50,000/)).toBeTruthy()
    expect(
      screen.getByText(/only after the refund posts/i),
    ).toBeTruthy()
  })

  it('primary + closing CTAs both link to /screener', () => {
    render(<ConciergePage />)
    const ctas = screen.getAllByRole('link', { name: /check eligibility/i })
    expect(ctas.length).toBeGreaterThanOrEqual(2)
    for (const c of ctas) {
      expect(c.getAttribute('href')).toBe('/screener')
    }
  })
})
