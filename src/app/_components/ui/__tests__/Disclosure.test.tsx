// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  TrustFootnote,
} from '../Disclosure'

/**
 * Canonical trust constants live in one module per
 * .claude/rules/disclosure-language-required.md ("appears verbatim
 * across surfaces — never paraphrased"). Tests freeze the wording so
 * accidental edits trigger a failing test.
 */

describe('canonical trust constants', () => {
  it('CANONICAL_TRUST_PROMISE matches the docs/DESIGN-LANGUAGE.md verbatim text', () => {
    expect(CANONICAL_TRUST_PROMISE).toBe(
      'We help prepare your refund file. We do not guarantee CBP will approve it. We do not provide legal advice in this product. Every artifact you receive has been reviewed by a real person before it reaches you.',
    )
  })

  it('NOT_LEGAL_ADVICE_DISCLOSURE includes the canonical phrase', () => {
    expect(NOT_LEGAL_ADVICE_DISCLOSURE).toMatch(/Not legal advice/)
    expect(NOT_LEGAL_ADVICE_DISCLOSURE).toMatch(/customs brokerage/)
  })
})

describe('<TrustFootnote>', () => {
  it('renders the canonical disclosure as real text + a link to /trust', () => {
    render(<TrustFootnote />)
    // Phrase appears as both an eyebrow label and inline in the body sentence.
    const matches = screen.getAllByText(/Not legal advice|not legal advice/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
    const link = screen.getByRole('link', { name: /how we handle your data/i })
    expect(link.getAttribute('href')).toBe('/trust')
  })

  it('renders inside a contentinfo landmark when used as a standalone footer', () => {
    render(<TrustFootnote asFooter />)
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })

  it('does NOT render its own contentinfo when nested inside an existing footer', () => {
    render(<TrustFootnote />)
    expect(screen.queryByRole('contentinfo')).toBeNull()
  })
})
