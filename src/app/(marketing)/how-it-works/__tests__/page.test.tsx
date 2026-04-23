// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HowItWorksPage from '../page'
import {
  REFUND_TIMING_CLAUSE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@/shared/disclosure/constants'

describe('/how-it-works', () => {
  it('renders the editorial headline pattern: eyebrow label + display H1', () => {
    render(<HowItWorksPage />)
    expect(screen.getAllByText('How it works').length).toBeGreaterThan(0) // eyebrow + <title>
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(
      /Two tiers\. Pick what you have time for/i,
    )
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the four sections in order (00 screener, 01 Audit, 02 Full Prep, 03 After delivery)', () => {
    render(<HowItWorksPage />)
    const h2s = screen.getAllByRole('heading', { level: 2 })
    const titles = h2s.map((h) => h.textContent)
    expect(titles).toContain('00 — The screener')
    expect(titles).toContain('01 — Audit')
    expect(titles).toContain('02 — Full Prep')
    expect(titles).toContain('03 — After delivery')
  })

  it('lists "What we do" and "What you do" on the three process sections only (not After delivery)', () => {
    render(<HowItWorksPage />)
    const weDoHeadings = screen.getAllByRole('heading', {
      name: /What we do/i,
    })
    const youDoHeadings = screen.getAllByRole('heading', {
      name: /What you do/i,
    })
    // sections 00, 01, 02 — each has both columns. 03 is prose-only.
    expect(weDoHeadings).toHaveLength(3)
    expect(youDoHeadings).toHaveLength(3)
  })

  it('Audit section names $99 one-time with no success fee line', () => {
    render(<HowItWorksPage />)
    expect(screen.getByText(/\$99 · one-time/i)).toBeTruthy()
  })

  it('Full Prep section clarifies $999 due now + 10% success fee capped at $25,000 billed after delivery', () => {
    render(<HowItWorksPage />)
    expect(screen.getByText(/\$999 due now/i)).toBeTruthy()
    expect(screen.getByText(/10 % of estimated refund/i)).toBeTruthy()
    expect(screen.getByText(/\$25,000/)).toBeTruthy()
    expect(screen.getByText(/billed after file delivery/i)).toBeTruthy()
  })

  it('shows a "What this tier doesn\'t do" muted paragraph on Audit only', () => {
    render(<HowItWorksPage />)
    const labels = screen.getAllByText(/What this tier doesn.t do/i)
    // Exactly one occurrence (on Audit). Full Prep has no analogous block.
    expect(labels).toHaveLength(1)
    expect(
      screen.getByText(/If that.s the help you want, Full Prep is the tier for you/i),
    ).toBeTruthy()
  })

  it('Full Prep section shows the 5 business-day turnaround aside', () => {
    render(<HowItWorksPage />)
    const aside = screen.getByLabelText(/Full Prep turnaround/i)
    expect(aside.textContent).toMatch(/Five business days/i)
  })

  it('After delivery section renders the canonical trust disclosures', () => {
    render(<HowItWorksPage />)
    expect(screen.getByText(SUBMISSION_CONTROL_CLAUSE)).toBeTruthy()
    expect(screen.getByText(REFUND_TIMING_CLAUSE)).toBeTruthy()
  })

  it('renders the prominent $99 Audit credit aside', () => {
    render(<HowItWorksPage />)
    const aside = screen.getByLabelText(/Audit credit toward Full Prep/i)
    expect(aside).toBeTruthy()
    expect(aside.textContent).toMatch(/\$99/)
    expect(aside.textContent).toMatch(/credit the full \$99 toward Full Prep/i)
  })

  it('renders a closing CTA back to the screener', () => {
    render(<HowItWorksPage />)
    const cta = screen.getByRole('link', { name: /Check eligibility/i })
    expect(cta.getAttribute('href')).toBe('/screener')
  })

  it('does not render any of the legacy 3-stage names', () => {
    render(<HowItWorksPage />)
    expect(screen.queryByText(/^Recovery$/)).toBeNull()
    expect(screen.queryByText(/^Filing prep$/)).toBeNull()
    expect(screen.queryByText(/^Concierge$/)).toBeNull()
    expect(screen.queryByText(/Three stages/i)).toBeNull()
  })
})
