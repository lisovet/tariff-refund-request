import { expect, test } from '@playwright/test'

test.describe('/concierge', () => {
  test('renders Stage 03 editorial page with success-fee block + CTA', async ({
    page,
  }) => {
    await page.goto('/concierge')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /hand off the filing/i,
    )
    await expect(page.getByText(/only after the refund posts/i)).toBeVisible()
    await expect(page.getByText('$50,000').first()).toBeVisible()
    await expect(
      page.getByRole('link', { name: /check eligibility/i }).first(),
    ).toHaveAttribute('href', '/screener')
  })
})
