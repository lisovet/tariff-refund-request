// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteFooter } from '../SiteFooter'

describe('<SiteFooter>', () => {
  it('renders the canonical "Not legal advice" disclosure as real text', () => {
    // Per .claude/rules/disclosure-language-required.md: real text, not images,
    // not collapsed accordions. The phrase appears as both an eyebrow label
    // and inside the body sentence — both are valid (multiple matches OK).
    render(<SiteFooter />)
    const matches = screen.getAllByText(/Not legal advice|not legal advice/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('links to the canonical /trust page from the nav + footnote CTA', () => {
    render(<SiteFooter />)
    // Both the nav link and the inline "How we handle your data →"
    // CTA in the disclosure footnote point at /trust.
    const links = screen.getAllByRole('link', {
      name: /how we handle your data/i,
    })
    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link.getAttribute('href')).toBe('/trust')
    }
  })

  it('renders inside a <footer> landmark', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })
})
