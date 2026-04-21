// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ForAgenciesPage from '../page'

describe('/for-agencies', () => {
  it('renders the editorial H1 in the display face', () => {
    render(<ForAgenciesPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/scale tariff recovery for your clients/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the three partner tiers with rev-share labels', () => {
    render(<ForAgenciesPage />)
    expect(screen.getByText(/referral partner/i)).toBeTruthy()
    expect(screen.getByText(/^co-branded$/i)).toBeTruthy()
    expect(screen.getByText(/^white-label$/i)).toBeTruthy()
    expect(screen.getByText(/15 – 25% rev share/)).toBeTruthy()
    expect(screen.getByText(/25 – 35% rev share/)).toBeTruthy()
  })

  it('primary CTA is a mailto to partners@', () => {
    render(<ForAgenciesPage />)
    const ctas = screen.getAllByRole('link', { name: /partner|partners@/i })
    const mailtos = ctas.filter((c) =>
      (c.getAttribute('href') ?? '').startsWith('mailto:partners@'),
    )
    expect(mailtos.length).toBeGreaterThanOrEqual(1)
  })

  it('links back to /trust + /trust/sub-processors (partner-due-diligence path)', () => {
    render(<ForAgenciesPage />)
    const trustLinks = screen.getAllByRole('link', {
      name: /how we handle customer data/i,
    })
    expect(trustLinks.some((l) => l.getAttribute('href') === '/trust')).toBe(true)
    expect(
      screen.getByRole('link', { name: /sub-processor list/i }).getAttribute('href'),
    ).toBe('/trust/sub-processors')
  })
})
