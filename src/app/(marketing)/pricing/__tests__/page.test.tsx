// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PricingPage from '../page'
import { PRICE_LADDER, priceFor } from '@contexts/billing'

/**
 * /pricing must mirror PRICE_LADDER verbatim — no hand-typed numbers.
 * The snapshot tests below pull straight from pricing.ts so when the
 * ladder changes, the tests re-pin the page automatically.
 */

function renderPricing() {
  return render(<PricingPage />)
}

function dollars(cents: number): string {
  const whole = Math.trunc(cents / 100)
  const formatted = whole.toLocaleString('en-US')
  if (cents % 100 === 0) return `$${formatted}`
  const fractional = String(cents % 100).padStart(2, '0')
  return `$${formatted}.${fractional}`
}

describe('/pricing — page structure', () => {
  it('renders the editorial H1', () => {
    renderPricing()
    expect(
      screen.getByRole('heading', { level: 1, name: /pricing|paid in stages/i }),
    ).toBeInTheDocument()
  })

  it('renders three stage columns: free, recover, prepare', () => {
    renderPricing()
    // Heading anchors per stage. Free tier rendered with same weight,
    // not de-emphasized.
    expect(screen.getByRole('heading', { name: /find out if you qualify/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /recover your entries/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /prepare your file/i })).toBeInTheDocument()
  })

  it('renders Concierge as a separate section below', () => {
    renderPricing()
    // Section heading + product-row heading both contain "Concierge".
    const matches = screen.getAllByRole('heading', { name: /concierge/i })
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('does not render a "popular" badge or any plan badge', () => {
    renderPricing()
    expect(screen.queryByText(/popular/i)).toBeNull()
    expect(screen.queryByText(/recommended/i)).toBeNull()
    expect(screen.queryByText(/best value/i)).toBeNull()
  })

  it('does not pitch "Get a Quote" or "Contact Sales" — direct prices only', () => {
    renderPricing()
    expect(screen.queryByText(/get a quote/i)).toBeNull()
    expect(screen.queryByText(/contact sales/i)).toBeNull()
  })
})

describe('/pricing — figures from pricing.ts (no hand-typed numbers)', () => {
  it.each([
    ['recovery_kit', 'smb'],
    ['recovery_kit', 'mid_market'],
    ['recovery_service', 'smb'],
    ['recovery_service', 'mid_market'],
    ['cape_prep_standard', 'smb'],
    ['cape_prep_standard', 'mid_market'],
    ['cape_prep_premium', 'smb'],
    ['cape_prep_premium', 'mid_market'],
    ['concierge_base', 'smb'],
    ['concierge_base', 'mid_market'],
    ['monitoring', 'smb'],
    ['monitoring', 'mid_market'],
  ] as const)('renders %s/%s exactly as priced in pricing.ts', (sku, tier) => {
    renderPricing()
    const expected = dollars(priceFor(sku, tier).usdCents)
    // Use getAllByText because the ladder repeats some round figures.
    expect(screen.getAllByText(new RegExp(expected.replace('$', '\\$'))).length).toBeGreaterThan(0)
  })

  it('exposes every SKU on the page', () => {
    renderPricing()
    for (const sku of Object.keys(PRICE_LADDER)) {
      // SKU labels are humanized in the UI — assert at least a recognizable
      // anchor for each, by data-sku attribute.
      expect(document.querySelector(`[data-sku="${sku}"]`)).not.toBeNull()
    }
  })

  it('renders prices in monospace numerics (Berkeley Mono fallback)', () => {
    renderPricing()
    const recoveryRow = document.querySelector('[data-sku="recovery_kit"]')
    expect(recoveryRow).not.toBeNull()
    const priceCell = recoveryRow?.querySelector('[data-price-mono]')
    expect(priceCell).not.toBeNull()
    expect(priceCell?.className).toMatch(/font-mono/)
  })
})

describe('/pricing — success-fee disclosure on Concierge', () => {
  it('mentions the SMB band 10–12% explicitly', () => {
    renderPricing()
    const concierge = screen.getByRole('region', { name: /concierge/i })
    const text = within(concierge).getByText(/10\s*[–-]\s*12\s*%/i)
    expect(text).toBeInTheDocument()
  })

  it('mentions the mid-market band 8–10% explicitly', () => {
    renderPricing()
    const concierge = screen.getByRole('region', { name: /concierge/i })
    expect(within(concierge).getByText(/8\s*[–-]\s*10\s*%/i)).toBeInTheDocument()
  })

  it('discloses the per-case hard cap', () => {
    renderPricing()
    const concierge = screen.getByRole('region', { name: /concierge/i })
    expect(within(concierge).getByText(/\$50,000/)).toBeInTheDocument()
  })

  it('frames the success fee against the realized refund, not estimate', () => {
    renderPricing()
    const concierge = screen.getByRole('region', { name: /concierge/i })
    expect(within(concierge).getByText(/realized refund/i)).toBeInTheDocument()
  })
})

describe('/pricing — anti-positioning', () => {
  it('CTA points at the screener (free entry to the ladder)', () => {
    renderPricing()
    const cta = screen.getAllByRole('link', { name: /check eligibility|start the screener|start screener/i })[0]
    expect(cta).toBeDefined()
    expect(cta?.getAttribute('href')).toBe('/screener')
  })
})
