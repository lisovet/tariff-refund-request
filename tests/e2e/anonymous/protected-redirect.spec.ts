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

  test('returnBackUrl echoes the public origin, never the internal node host', async ({
    page,
    baseURL,
  }) => {
    // Regression: Clerk redirect_url was being built from req.url, which
    // on Railway resolves to localhost:8080. The middleware now reads
    // NEXT_PUBLIC_APP_URL; assert the result lines up with the test
    // baseURL, not the internal process host.
    await page.goto('/app')
    const finalUrl = page.url()
    // Sign-in URL should contain a redirect_url query param; its value
    // should point at the same origin the browser was pointed at.
    const match = finalUrl.match(/[?&]redirect_url=([^&]+)/)
    expect(match, `no redirect_url in ${finalUrl}`).toBeTruthy()
    const decoded = decodeURIComponent(match![1] ?? '')
    const expectedOrigin = new URL(baseURL ?? 'http://localhost:3000').origin
    expect(decoded).toContain(expectedOrigin)
    expect(decoded).not.toMatch(/localhost:8080/)
  })
})
