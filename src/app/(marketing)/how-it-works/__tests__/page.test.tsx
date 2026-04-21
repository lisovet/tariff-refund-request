// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HowItWorksPage from '../page'

describe('/how-it-works', () => {
  it('renders the editorial headline pattern: eyebrow label + display H1', () => {
    render(<HowItWorksPage />)
    expect(screen.getByText('How it works')).toBeTruthy() // eyebrow
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Three stages\. Stop when you have what you need/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the three stages in funnel order with editorial typography', () => {
    render(<HowItWorksPage />)
    const h2s = screen.getAllByRole('heading', { level: 2 })
    const titles = h2s.map((h) => h.textContent)
    expect(titles).toContain('01 — Recovery')
    expect(titles).toContain('02 — Filing prep')
    expect(titles).toContain('03 — Concierge')
  })

  it('lists "what we do" and "what you do" for every stage', () => {
    render(<HowItWorksPage />)
    const weDoHeadings = screen.getAllByRole('heading', {
      name: /What we do/i,
    })
    const youDoHeadings = screen.getAllByRole('heading', {
      name: /What you do/i,
    })
    expect(weDoHeadings).toHaveLength(3)
    expect(youDoHeadings).toHaveLength(3)
  })

  it('renders a closing CTA back to the screener', () => {
    render(<HowItWorksPage />)
    const cta = screen.getByRole('link', { name: /Check eligibility/i })
    expect(cta.getAttribute('href')).toBe('/screener')
  })
})
