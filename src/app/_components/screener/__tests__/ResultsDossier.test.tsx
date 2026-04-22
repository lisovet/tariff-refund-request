// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResultsDossier } from '../ResultsDossier'
import type { ScreenerResult } from '@contexts/screener'

// next/navigation's useRouter throws outside an app-router tree; stub it.
const pushSpy = vi.fn()
const refreshSpy = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy, refresh: refreshSpy }),
}))

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

  it('does not surface a confidence label on the refund hero', () => {
    render(<ResultsDossier result={qualified} />)
    expect(screen.queryByText(/^Confidence$/i)).toBeNull()
    expect(screen.queryByText(/Confidence: /i)).toBeNull()
  })

  it('renders a one-sentence editorial qualification verdict', () => {
    render(<ResultsDossier result={qualified} />)
    // Verdict copy should be sentence-case + end with a period.
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/\.$/)
  })

  it('renders each prerequisite row', () => {
    render(<ResultsDossier result={qualified} />)
    expect(screen.getByText('Importer of record')).toBeTruthy()
    expect(screen.getByText('ACE access')).toBeTruthy()
    expect(screen.getByText('Liquidation status known')).toBeTruthy()
    // Exact-text row label (not the explanatory missing-copy).
    expect(screen.getByText('ACH on file')).toBeTruthy()
  })

  it('marks missing prerequisites in blocking red with an × glyph and an explanation', () => {
    render(<ResultsDossier result={qualified} />)
    // ach is false in the fixture.
    const missingLabel = screen.getByText('ACH on file')
    expect(missingLabel.className).toMatch(/text-blocking/)
    // The missing-copy sub-label is present.
    expect(
      screen.getByText(/ACH on file is how CBP returns the money/i),
    ).toBeTruthy()
    const missingStatus = screen.getAllByLabelText('Missing')[0]
    expect(missingStatus?.className).toMatch(/text-blocking/)
    expect(missingStatus?.textContent).toMatch(/×/)
  })

  it('renders a N / 4 ready summary reflecting the prerequisites count', () => {
    render(<ResultsDossier result={qualified} />)
    // Fixture has ior + ace + liquidationKnown met, ach missing → 3 / 4.
    expect(screen.getByText(/3 \/ 4 ready/i)).toBeTruthy()
  })

  it('deep-links the primary CTA to the pricing anchor for recommendedNextStep', () => {
    render(<ResultsDossier result={qualified} />)
    const primary = screen.getByRole('link', { name: /See your options/i })
    // recovery_service → /pricing#recovery
    expect(primary.getAttribute('href')).toBe('/pricing#recovery')
  })

  it('maps cape_prep to /pricing#prep and concierge to /pricing#concierge', () => {
    const { rerender } = render(
      <ResultsDossier result={{ ...qualified, recommendedNextStep: 'cape_prep' }} />,
    )
    expect(
      screen.getByRole('link', { name: /See your options/i }).getAttribute('href'),
    ).toBe('/pricing#prep')
    rerender(
      <ResultsDossier result={{ ...qualified, recommendedNextStep: 'concierge' }} />,
    )
    expect(
      screen.getByRole('link', { name: /See your options/i }).getAttribute('href'),
    ).toBe('/pricing#concierge')
  })

  it('renders the next-step product name in display face and its bullet list', () => {
    render(<ResultsDossier result={qualified} />)
    const name = screen.getByRole('heading', { level: 2 })
    expect(name.textContent).toMatch(/Recovery Service/)
    expect(name.className).toMatch(/font-display/)
    // Three "what you get" bullets for recovery_service.
    expect(
      screen.getByText(/Analyst extracts entries from your uploads/i),
    ).toBeTruthy()
    expect(screen.getByText(/Source \+ confidence on every row/i)).toBeTruthy()
    expect(
      screen.getByText(/You get a single canonical entry list back/i),
    ).toBeTruthy()
  })

  it('keeps "How each stage works" as a quieter secondary link', () => {
    render(<ResultsDossier result={qualified} />)
    const secondary = screen.getByRole('link', { name: /How each stage works/i })
    expect(secondary.getAttribute('href')).toBe('/how-it-works')
  })
})

describe('<ResultsDossier> — disqualified', () => {
  it('renders a respectful headline with human-readable disqualification copy', () => {
    render(<ResultsDossier result={disqualified} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/Not a fit/i)
    expect(screen.getByText(/IEEPA refund window/i)).toBeTruthy()
  })

  it('does not render the raw disqualificationReason code', () => {
    render(<ResultsDossier result={disqualified} />)
    expect(screen.queryByText(/no_imports_in_window/)).toBeNull()
    const notIor: ScreenerResult = {
      ...disqualified,
      disqualificationReason: 'not_ior',
    }
    render(<ResultsDossier result={notIor} />)
    expect(screen.queryByText(/not_ior/)).toBeNull()
    expect(screen.getAllByText(/Importer of Record/i).length).toBeGreaterThan(0)
  })

  it('renders an opt-in for future updates per PRD 01 disqualified variant', () => {
    render(<ResultsDossier result={disqualified} />)
    expect(screen.getByText(/let you know|future updates/i)).toBeTruthy()
  })

  it('does NOT render the hero refund metric on disqualified results', () => {
    render(<ResultsDossier result={disqualified} />)
    expect(screen.queryByText(/\$\d/)).toBeNull()
  })

  it('renders a Start over button that clears result storage + navigates to /screener', () => {
    pushSpy.mockClear()
    window.sessionStorage.setItem(
      'tariff-refund:screener-result:v1',
      JSON.stringify({ foo: 'bar' }),
    )
    render(<ResultsDossier result={disqualified} />)
    const btn = screen.getByRole('button', { name: /Start over/i })
    fireEvent.click(btn)
    expect(
      window.sessionStorage.getItem('tariff-refund:screener-result:v1'),
    ).toBeNull()
    expect(pushSpy).toHaveBeenCalledWith('/screener')
  })
})
