// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import HomePage from '@/app/(marketing)/page'
import HowItWorksPage from '@/app/(marketing)/how-it-works/page'
import TrustPage from '@/app/(marketing)/trust/page'
import SubProcessorsPage from '@/app/(marketing)/trust/sub-processors/page'
import UiKitPage from '@/app/(marketing)/ui-kit/page'
import MarketingLayout from '@/app/(marketing)/layout'

/**
 * Integration test for task #18: the canonical "Not legal advice"
 * disclosure must be present on every public marketing page (per
 * .claude/rules/disclosure-language-required.md). The marketing
 * route-group layout wraps every child with SiteFooter, so this test
 * also asserts the layout-wrap behavior holds across our v1 pages.
 */

const PAGES: Array<{ name: string; node: React.ReactNode }> = [
  { name: 'HomePage', node: <HomePage /> },
  { name: 'HowItWorksPage', node: <HowItWorksPage /> },
  { name: 'TrustPage', node: <TrustPage /> },
  { name: 'SubProcessorsPage', node: <SubProcessorsPage /> },
  { name: 'UiKitPage', node: <UiKitPage /> },
]

describe('marketing footer presence', () => {
  it.each(PAGES)(
    '$name renders inside MarketingLayout with the disclosure footer',
    ({ node }) => {
      const { container } = render(<MarketingLayout>{node}</MarketingLayout>)
      // The footer landmark should exist exactly once.
      const footers = container.querySelectorAll('footer')
      expect(footers.length).toBe(1)
      // Disclosure text present in real form.
      expect(container.textContent).toMatch(/Not legal advice/i)
      // Link back to /trust present.
      const trustLinks = container.querySelectorAll('a[href="/trust"]')
      expect(trustLinks.length).toBeGreaterThanOrEqual(1)
    },
  )
})
