import { expect, test } from '@playwright/test'

test.describe('/recovery', () => {
  test('renders Stage 01 editorial page with pricing + CTA', async ({
    page,
  }) => {
    await page.goto('/recovery')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /rebuild your entry list/i,
    )
    await expect(
      page.getByRole('link', { name: /check eligibility/i }).first(),
    ).toHaveAttribute('href', '/screener')
  })
})
