import { expect, test } from '@playwright/test'

/**
 * Homepage structural baseline. Asserts the canonical sections are
 * present in the rendered DOM. Visual diff baseline is captured by
 * the existing ui-kit-baseline.spec.ts — homepage diffs would
 * stabilize once the licensed fonts are self-hosted.
 *
 * Lighthouse + axe-core a11y audits are CI-side per ADR 011 + PRD 05;
 * the .github/workflows/ci.yml e2e job runs this against the
 * Next dev server.
 */

test.describe('homepage', () => {
  test('renders the editorial hero + key sections in order', async ({ page }) => {
    await page.goto('/')

    // Hero
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /IEEPA tariff refund/i,
    )
    await expect(
      page.getByRole('link', { name: /Check eligibility/i }),
    ).toHaveAttribute('href', '/screener')

    // Three movements
    await expect(page.getByRole('heading', { name: 'Recovery' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Filing prep' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Concierge' })).toBeVisible()

    // Anti-positioning
    await expect(
      page.getByRole('heading', { name: /What we are not/i }),
    ).toBeVisible()

    // Pull-quote canonical promise
    await expect(page.locator('blockquote')).toContainText(
      /We help prepare your refund file/i,
    )

    // Footer "Not legal advice" disclosure as real text
    await expect(page.getByText(/Not legal advice/i)).toBeVisible()
  })
})
