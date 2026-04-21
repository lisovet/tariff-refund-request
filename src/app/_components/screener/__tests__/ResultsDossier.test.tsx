// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsDossier } from '../ResultsDossier'
import type { ScreenerResult } from '@contexts/screener'

const qualified: ScreenerResult = {
  qualification: 'qualified',
  refundEstimate: { low: 18000, high: 180000, confidence: 'high', version: 'v1' },
  confidence: 'high',
  recoveryPath: 'broker',
  prerequisites: { ace: true, ach: false, ior: true, liquidationKnown: true },
  recommendedNextStep: 'recovery_service',
  version: 'screener-v1+estimator-v1',
}

const disqualified: ScreenerResult = {
  qualification: 'disqualified',
  refundEstimate: null,
  confidence: 'low',
  recoveryPath: null,
  prerequisites: { ace: false, ach: false, ior: false, liquidationKnown: false },
  recommendedNextStep: 'none',
  disqualificationReason: 'no_imports_in_window',
  version: 'screener-v1+estimator-v1',
}

describe('<ResultsDossier> — qualified', () => {
  it('renders the hero refund metric in mono with both bounds + thousands separators', () => {
    render(<ResultsDossier result={qualified} />)
    const hero = screen.getByText(/\$18,000 — \$180,000/)
    expect(hero.className).toMatch(/font-mono/)
    // Display-class large size — at least 4xl per design notes (PRD 01).
    expect(hero.className).toMatch(/text-(4xl|5xl|6xl|7xl)/)
  })

  it('renders the confidence label in the accent face uppercased', () => {
    render(<ResultsDossier result={qualified} />)
    const label = screen.getByText(/Confidence: HIGH/)
    expect(label.className).toMatch(/text-accent/)
    expect(label.className).toMatch(/uppercase/)
  })

  it('renders a one-sentence editorial qualification verdict', () => {
    render(<ResultsDossier result={qualified} />)
    // Verdict copy should be sentence-case + end with a period.
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/\.$/)
  })

  it('renders the prerequisites block with met / missing status', () => {
    render(<ResultsDossier result={qualified} />)
    // Each prerequisite row.
    expect(screen.getByText(/Importer of record/i)).toBeTruthy()
    expect(screen.getByText(/ACE access/i)).toBeTruthy()
    expect(screen.getByText(/Liquidation status/i)).toBeTruthy()
    // ACH on file should show as "missing" since prerequisites.ach=false.
    expect(screen.getByText(/ACH on file/i)).toBeTruthy()
  })

  it('renders a single recommended-next-step CTA pointing at /how-it-works', () => {
    render(<ResultsDossier result={qualified} />)
    const ctas = screen.getAllByRole('link', { name: /See how/i })
    expect(ctas).toHaveLength(1)
    expect(ctas[0]?.getAttribute('href')).toBe('/how-it-works')
  })
})

describe('<ResultsDossier> — disqualified', () => {
  it('renders a respectful headline + the reason', () => {
    render(<ResultsDossier result={disqualified} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/Probably not a fit/i)
    expect(screen.getByText(/no_imports_in_window/)).toBeTruthy()
  })

  it('renders an opt-in for future updates per PRD 01 disqualified variant', () => {
    render(<ResultsDossier result={disqualified} />)
    expect(screen.getByText(/let you know|future updates/i)).toBeTruthy()
  })

  it('does NOT render the hero refund metric on disqualified results', () => {
    render(<ResultsDossier result={disqualified} />)
    expect(screen.queryByText(/\$\d/)).toBeNull()
  })
})
