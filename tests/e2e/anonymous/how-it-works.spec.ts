import { expect, test } from '@playwright/test'

test.describe('/how-it-works', () => {
  test('renders the three editorial stage movements', async ({ page }) => {
    await page.goto('/how-it-works')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Three movements/i,
    )
    await expect(
      page.getByRole('heading', { name: '01 — Recovery' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '02 — Filing prep' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '03 — Concierge' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Check eligibility/i }),
    ).toHaveAttribute('href', '/screener')
  })
})
