import { expect, test } from '@playwright/test'

/**
 * Visual baseline for the design-system primitives. The /ui-kit page is
 * the human-reviewable surface for `docs/DESIGN-LANGUAGE.md` compliance
 * — visiting it should always show every primitive in its canonical
 * state. This spec lives in the anonymous project so CI exercises it on
 * every PR.
 *
 * Real screenshot diffing (toHaveScreenshot) needs a baseline committed
 * with `npx playwright test --update-snapshots` against a stable
 * environment — that's a one-time human action. Until then, this spec
 * asserts the page loads and every primitive section is present, which
 * catches regressions like accidental component removal.
 */

test.describe('ui-kit baseline', () => {
  test('renders every primitive section', async ({ page }) => {
    await page.goto('/ui-kit')
    await expect(page.getByRole('heading', { level: 1, name: 'UI primitives' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Buttons' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Status banner' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Eyebrow + Hairline' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Footnote' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible()
  })
})
