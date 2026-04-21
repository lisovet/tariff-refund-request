import { expect, test } from '@playwright/test'

/**
 * Verifies the middleware redirects unauth users away from /ops to
 * /sign-in. Skips when Clerk is not configured. The
 * "authed-but-not-staff bounces to /app" branch needs a real Clerk
 * session and lands in tests/e2e/customer/* once @clerk/testing is
 * wired (task #11).
 */

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

test.describe('ops route gating', () => {
  test.skip(!clerkConfigured, 'Clerk env not configured — skipping live ops gate test')

  test('GET /ops while signed-out redirects to /sign-in', async ({ page }) => {
    await page.goto('/ops')
    expect(page.url()).toContain('/sign-in')
  })
})
