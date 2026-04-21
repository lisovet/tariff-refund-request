import { expect, test } from '@playwright/test'

test.describe('/for-agencies', () => {
  test('renders partner page with three tiers + mailto CTA', async ({
    page,
  }) => {
    await page.goto('/for-agencies')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /scale tariff recovery for your clients/i,
    )
    await expect(page.getByText(/referral partner/i)).toBeVisible()
    await expect(page.getByText(/^Co-branded$/)).toBeVisible()
    await expect(page.getByText(/^White-label$/)).toBeVisible()

    const mailtoLinks = page.locator('a[href^="mailto:partners@"]')
    await expect(mailtoLinks.first()).toBeVisible()
  })
})
