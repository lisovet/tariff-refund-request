import { expect, test } from '@playwright/test'

test.describe('/screener', () => {
  test('happy path: q1=yes → q2 visible (sessionStorage in-flight)', async ({
    page,
  }) => {
    await page.goto('/screener')
    await expect(page.getByText(/Q1 ?\/ ?10/i)).toBeVisible()
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByText(/Q2 ?\/ ?10/i)).toBeVisible()
  })

  test('disqualification: q1=no produces the respectful exit + reason', async ({
    page,
  }) => {
    await page.goto('/screener')
    await page.getByRole('button', { name: 'No' }).click()
    await expect(
      page.getByRole('heading', { name: /Probably not a fit/i }),
    ).toBeVisible()
    await expect(
      page.getByText(/no_imports_in_window/i),
    ).toBeVisible()
  })

  test('back button returns one question', async ({ page }) => {
    await page.goto('/screener')
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByText(/Q2 ?\/ ?10/i)).toBeVisible()
    await page.getByRole('button', { name: /previous/i }).click()
    await expect(page.getByText(/Q1 ?\/ ?10/i)).toBeVisible()
  })
})
