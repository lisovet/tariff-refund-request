// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PricingPage from '../page'

/**
 * /pricing — two-tier layout (Audit + Full Prep). Replaces the
 * previous 3-stage ladder. Prices and copy flow from
 * `@contexts/billing` TIERS so there are no hand-typed dollar values
 * in the view.
 */

function renderPricing() {
  return render(<PricingPage />)
}

describe('/pricing — page structure', () => {
  it('renders the editorial H1', () => {
    renderPricing()
    expect(
      screen.getByRole('heading', { level: 1, name: /two tiers/i }),
    ).toBeInTheDocument()
  })

  it('renders an Audit card and a Full Prep card', () => {
    renderPricing()
    expect(document.querySelector('[data-tier="audit"]')).not.toBeNull()
    expect(document.querySelector('[data-tier="full_prep"]')).not.toBeNull()
  })

  it('no longer renders the legacy 3-stage headings', () => {
    renderPricing()
    expect(
      screen.queryByRole('heading', { name: /rebuild your entry list/i }),
    ).toBeNull()
    expect(
      screen.queryByRole('heading', {
        name: /turn it into a submission-ready package/i,
      }),
    ).toBeNull()
  })

  it('does not render the legacy Concierge / Monitoring rows', () => {
    renderPricing()
    expect(document.querySelector('[data-sku="concierge_base"]')).toBeNull()
    expect(document.querySelector('[data-sku="monitoring"]')).toBeNull()
  })

  it('does not render a popular / recommended / best-value badge', () => {
    renderPricing()
    expect(screen.queryByText(/popular/i)).toBeNull()
    expect(screen.queryByText(/best value/i)).toBeNull()
  })

  it('does not pitch "Get a Quote" or "Contact Sales"', () => {
    renderPricing()
    expect(screen.queryByText(/get a quote/i)).toBeNull()
    expect(screen.queryByText(/contact sales/i)).toBeNull()
  })
})

describe('/pricing — tier prices', () => {
  it('Audit is $99 one-time and has no success fee line', () => {
    renderPricing()
    const audit = document.querySelector('[data-tier="audit"]') as HTMLElement
    expect(within(audit).getByText('$99')).toBeInTheDocument()
    expect(within(audit).getByText(/one time/i)).toBeInTheDocument()
    expect(within(audit).queryByText(/success fee/i)).toBeNull()
  })

  it('Full Prep is $999 + success fee with the 10% / $25,000 cap line', () => {
    renderPricing()
    const fp = document.querySelector(
      '[data-tier="full_prep"]',
    ) as HTMLElement
    expect(within(fp).getByText('$999')).toBeInTheDocument()
    expect(within(fp).getByText(/\+ success fee/i)).toBeInTheDocument()
    expect(
      within(fp).getByText(/10% of estimated refund/i),
    ).toBeInTheDocument()
    expect(within(fp).getByText(/cap \$25,000/i)).toBeInTheDocument()
  })

  it('renders prices in monospace numerics (Berkeley Mono fallback)', () => {
    renderPricing()
    const audit = document.querySelector('[data-tier="audit"]')
    const priceCell = audit?.querySelector('[data-price-mono]')
    expect(priceCell).not.toBeNull()
    expect(priceCell?.className).toMatch(/font-mono/)
  })
})

describe('/pricing — success fee section', () => {
  it('names the 10 % rate and the $25,000 cap', () => {
    renderPricing()
    const section = screen.getByRole('region', { name: /success fee/i })
    expect(within(section).getByRole('heading', { level: 2 }).textContent).toMatch(
      /10\s*%/,
    )
    expect(
      within(section).getByRole('heading', { level: 2 }).textContent,
    ).toMatch(/\$25,000/)
  })

  it('explains the fee is charged against the estimate, not CBP', () => {
    renderPricing()
    const section = screen.getByRole('region', { name: /success fee/i })
    expect(
      within(section).getAllByText(/estimated/i).length,
    ).toBeGreaterThan(0)
  })

  it('advertises the $99 Audit credit toward Full Prep', () => {
    renderPricing()
    expect(
      screen.getAllByText(/\$99 credits toward Full Prep/i).length,
    ).toBeGreaterThan(0)
  })

  it('fee table renders correct math (5% → 10% repricing)', () => {
    renderPricing()
    const table = screen.getByRole('table', {
      name: /success fee by estimated refund/i,
    })
    // $5,000 refund row → 10% = $500 success fee, $1,499 total, $4,500 kept.
    expect(within(table).getByText(/^\$500$/)).toBeInTheDocument()
    expect(within(table).getByText(/^\$1,499$/)).toBeInTheDocument()
    expect(within(table).getByText(/^\$4,500$/)).toBeInTheDocument()
    // Cap row: $250,000 refund → cap applies at $25,000.
    expect(within(table).getAllByText(/^\$25,000$/).length).toBeGreaterThan(0)
    // Capped flag appears at least once.
    expect(within(table).getAllByText(/^cap$/i).length).toBeGreaterThan(0)
  })
})

describe('/pricing — CTA', () => {
  it('CTA points at the screener (free entry to the tiers)', () => {
    renderPricing()
    const ctas = screen.getAllByRole('link', {
      name: /check eligibility/i,
    })
    expect(ctas.length).toBeGreaterThan(0)
    for (const cta of ctas) {
      expect(cta.getAttribute('href')).toBe('/screener')
    }
  })
})
