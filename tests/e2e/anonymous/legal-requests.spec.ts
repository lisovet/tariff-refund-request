import { expect, test } from '@playwright/test'

test.describe('/trust/legal-requests', () => {
  test('renders policy page with five-step process + contact + sub-processor link', async ({
    page,
  }) => {
    await page.goto('/trust/legal-requests')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /how we handle legal requests/i,
    )
    await expect(page.getByText(/Step 01/)).toBeVisible()
    await expect(page.getByText(/Step 05/)).toBeVisible()
    await expect(
      page.getByRole('table').getByText(/7 years/).first(),
    ).toBeVisible()
    await expect(page.getByText(/legal@tariffrefundrequest\.com/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: /sub-processor/i }).first(),
    ).toHaveAttribute('href', '/trust/sub-processors')
  })
})
