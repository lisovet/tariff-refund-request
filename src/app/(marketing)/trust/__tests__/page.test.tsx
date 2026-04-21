// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrustPage from '../page'

describe('/trust', () => {
  it('renders the canonical trust promise verbatim', () => {
    // Per .claude/rules/disclosure-language-required.md: the canonical
    // promise must appear verbatim across surfaces — never paraphrased.
    render(<TrustPage />)
    expect(screen.getByText(/We help prepare your refund file/i)).toBeTruthy()
    expect(
      screen.getByText(/We do not guarantee CBP will approve it/i),
    ).toBeTruthy()
    expect(screen.getByText(/We do not provide legal advice/i)).toBeTruthy()
    expect(
      screen.getByText(/Every artifact you receive has been reviewed/i),
    ).toBeTruthy()
  })

  it('lists the canonical "What we are not" non-goals', () => {
    render(<TrustPage />)
    expect(screen.getByText(/Not a customs broker/i)).toBeTruthy()
    expect(screen.getByText(/Not a law firm/i)).toBeTruthy()
    expect(
      screen.getByText(/We do not auto-submit/i),
    ).toBeTruthy()
  })

  it('renders sections for data handling, retention, customer rights, security, compliance', () => {
    render(<TrustPage />)
    expect(screen.getByRole('heading', { name: /What we collect/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Retention/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Your rights/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Security posture/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Compliance/i })).toBeTruthy()
  })

  it('links to the sub-processors page', () => {
    render(<TrustPage />)
    const subprocLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/trust/sub-processors')
    expect(subprocLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders disclosures with real footnote markup (not images)', () => {
    render(<TrustPage />)
    // Real footnote pattern: <sup> reference + <li id="...-content"> in footer block.
    const sups = document.querySelectorAll('sup')
    expect(sups.length).toBeGreaterThanOrEqual(1)
  })
})
