import { expect, test } from '@playwright/test'

test.describe('/cape-prep', () => {
  test('renders Stage 02 editorial page with pricing + CTA', async ({
    page,
  }) => {
    await page.goto('/cape-prep')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /turn entries into a file your broker can submit/i,
    )
    await expect(
      page.getByRole('link', { name: /check eligibility/i }).first(),
    ).toHaveAttribute('href', '/screener')
  })
})
