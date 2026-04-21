import { expect, test } from '@playwright/test'

test.describe('/trust', () => {
  test('renders the canonical trust promise + sections + sub-processors link', async ({
    page,
  }) => {
    await page.goto('/trust')
    await expect(page.locator('blockquote')).toContainText(
      /We help prepare your refund file/i,
    )
    await expect(
      page.getByRole('heading', { name: /What we collect/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Retention/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /sub-processor list/i }),
    ).toHaveAttribute('href', '/trust/sub-processors')
  })
})

test.describe('/trust/sub-processors', () => {
  test('renders the typeset table with the canonical vendor list', async ({
    page,
  }) => {
    await page.goto('/trust/sub-processors')
    await expect(page.getByRole('table')).toBeVisible()
    // Vendors asserted verbatim. Railway replaced Vercel + Neon in
    // the infra-consolidation swap; the presence check is pinned
    // against the canonical shared list.
    await expect(page.getByText('Railway')).toBeVisible()
    await expect(page.getByText('Stripe')).toBeVisible()
    await expect(page.getByText('Cloudflare R2')).toBeVisible()
    await expect(page.getByText('Anthropic')).toBeVisible()
  })
})
