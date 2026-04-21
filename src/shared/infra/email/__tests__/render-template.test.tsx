// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderEmail } from '../render'
import { ScreenerResultsEmail } from '../templates/ScreenerResultsEmail'

describe('renderEmail — ScreenerResultsEmail', () => {
  it('produces HTML + plain-text variants', async () => {
    const out = await renderEmail(
      <ScreenerResultsEmail
        firstName="Alex"
        resultsUrl="https://example.test/screener?token=abc"
      />,
    )
    expect(out.html).toMatch(/<html/i)
    expect(out.html).toMatch(/Alex/)
    expect(out.html).toMatch(/example\.test\/screener\?token=abc/)
    expect(out.text).toMatch(/Alex/)
    expect(out.text).toMatch(/example\.test\/screener\?token=abc/)
  })

  it('falls back to a generic salutation when firstName is missing', async () => {
    const out = await renderEmail(
      <ScreenerResultsEmail resultsUrl="https://example.test/x" />,
    )
    expect(out.html).toMatch(/Your screener results/i)
  })

  it('includes the canonical "Not legal advice" disclosure verbatim', async () => {
    // Per .claude/rules/disclosure-language-required.md.
    const out = await renderEmail(
      <ScreenerResultsEmail resultsUrl="https://example.test/x" />,
    )
    expect(out.html).toMatch(/Not legal advice/)
    expect(out.text).toMatch(/Not legal advice/)
  })
})
