import { expect, test } from '@playwright/test'

/**
 * Verifies the middleware redirects unauthed users from a protected
 * route to /sign-in. Skips when Clerk is not configured (real auth
 * needs CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY in the env).
 */

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

test.describe('protected route gating', () => {
  test.skip(!clerkConfigured, 'Clerk env not configured — skipping live redirect test')

  test('GET /app while signed-out redirects to /sign-in', async ({ page }) => {
    const response = await page.goto('/app')
    // After the redirect, page URL should land on the sign-in route.
    expect(page.url()).toContain('/sign-in')
    expect(response?.status()).toBeLessThan(500)
  })
})
