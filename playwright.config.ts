import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config — three role-scoped projects per ADR 011 + PRD 04:
 *
 *   anonymous  — marketing site + screener flows, no auth
 *   customer   — authenticated customer app
 *   ops-staff  — internal ops console (analyst / validator / coordinator)
 *
 * Browsers must be installed once: `npx playwright install --with-deps`.
 * Browser binaries are not committed; CI re-installs.
 *
 * The webServer block boots Next on demand. Real test logins use the
 * @clerk/testing helpers (wired in task #8); for now the anonymous
 * project exercises marketing + screener.
 */

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'anonymous',
      testMatch: /tests\/e2e\/anonymous\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'customer',
      testMatch: /tests\/e2e\/customer\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // TODO(task-8): replace with @clerk/testing storage state path.
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'ops-staff',
      testMatch: /tests\/e2e\/ops\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // TODO(task-9): wire ops-role storage state via @clerk/testing.
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev:next',
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
})
