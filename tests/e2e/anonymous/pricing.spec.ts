import { expect, test } from '@playwright/test'

test.describe('/pricing', () => {
  test('renders three workflow stages with figures from pricing.ts', async ({
    page,
  }) => {
    await page.goto('/pricing')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Paid in stages/i,
    )

    // Each stage section heading exists.
    await expect(
      page.getByRole('heading', { name: /find out if you qualify/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /recover your entries/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /prepare your file/i }),
    ).toBeVisible()

    // Concierge as a separate region with success-fee disclosure.
    await expect(
      page.getByRole('region', { name: /concierge/i }).getByText(/realized refund/i),
    ).toBeVisible()
    await expect(
      page.getByRole('region', { name: /concierge/i }).getByText(/\$50,000/),
    ).toBeVisible()

    // No popular badges.
    await expect(page.getByText(/popular|recommended|best value/i)).toHaveCount(0)

    // CTA at the bottom.
    await expect(
      page.getByRole('link', { name: /check eligibility/i }),
    ).toHaveAttribute('href', '/screener')
  })
})
