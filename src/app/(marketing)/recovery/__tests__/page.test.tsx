// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecoveryPage from '../page'

describe('/recovery', () => {
  it('renders the editorial H1 in the display face', () => {
    render(<RecoveryPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/rebuild your entry list/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the three recovery paths (broker, carrier, ACE)', () => {
    render(<RecoveryPage />)
    expect(screen.getAllByText(/broker path/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/carrier path/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ACE self-export/i).length).toBeGreaterThan(0)
  })

  it('renders pricing rows pulled from pricing.ts (both SKUs + mono dollar figures)', () => {
    render(<RecoveryPage />)
    const container = document.querySelector('[data-sku="recovery_kit"]')
    expect(container).toBeTruthy()
    const priceCell = container?.querySelector('[data-price-mono]')
    expect(priceCell?.textContent).toMatch(/\$\d/)
    expect(priceCell?.className).toMatch(/font-mono/)

    expect(document.querySelector('[data-sku="recovery_service"]')).toBeTruthy()
  })

  it('primary + closing CTAs both link to /screener', () => {
    render(<RecoveryPage />)
    const ctas = screen.getAllByRole('link', { name: /check eligibility/i })
    expect(ctas.length).toBeGreaterThanOrEqual(2)
    for (const c of ctas) {
      expect(c.getAttribute('href')).toBe('/screener')
    }
  })
})
