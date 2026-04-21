import { expect, test } from '@playwright/test'

/**
 * Sample anonymous spec — verifies the marketing route group loads.
 * Real homepage content lands in task #14; this is the structural
 * smoke test for the e2e pipeline.
 */

test.describe('marketing route group', () => {
  test('responds 200 on /', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })
})
