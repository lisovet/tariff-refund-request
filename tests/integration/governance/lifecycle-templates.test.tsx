// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render } from '@react-email/render'

import { ScreenerResultsEmail } from '@/shared/infra/email/templates/ScreenerResultsEmail'
import { ScreenerNudge24hEmail } from '@/shared/infra/email/templates/ScreenerNudge24hEmail'
import { ScreenerNudge72hEmail } from '@/shared/infra/email/templates/ScreenerNudge72hEmail'
import { RecoveryPurchasedEmail } from '@/shared/infra/email/templates/RecoveryPurchasedEmail'
import { RecoveryMissingDocsEmail } from '@/shared/infra/email/templates/RecoveryMissingDocsEmail'
import { EntryListReadyEmail } from '@/shared/infra/email/templates/EntryListReadyEmail'
import { PrepReadyEmail } from '@/shared/infra/email/templates/PrepReadyEmail'
import { ConciergeUpsellEmail } from '@/shared/infra/email/templates/ConciergeUpsellEmail'
import { ReengagementEmail } from '@/shared/infra/email/templates/ReengagementEmail'

/**
 * Lifecycle-template governance per task #32 (USER-TEST checkpoint).
 * Codifies the human review heuristics so the founder/ops walk-through
 * starts from a known-good baseline:
 *
 *   1. Every v1 lifecycle template exists.
 *   2. Every template wraps EmailLayout (canonical "Not legal advice"
 *      disclosure renders on every send).
 *   3. No banner-shaped HTML — no big colored backgrounds, no
 *      attention-grab tables.
 *   4. No AI copywriting clichés (Elevate, Seamless, Unleash, etc.
 *      from minimalist-ui banned-words list).
 *   5. Real-text content — no image-only emails.
 */

const TEMPLATES_DIR = join(
  process.cwd(),
  'src',
  'shared',
  'infra',
  'email',
  'templates',
)

const REQUIRED_TEMPLATES = [
  'ScreenerResultsEmail.tsx',
  'ScreenerNudge24hEmail.tsx',
  'ScreenerNudge72hEmail.tsx',
  'RecoveryPurchasedEmail.tsx',
  'RecoveryMissingDocsEmail.tsx',
  'EntryListReadyEmail.tsx',
  'PrepReadyEmail.tsx',
  'ConciergeUpsellEmail.tsx',
  'ReengagementEmail.tsx',
] as const

const BANNED_WORDS = [
  'elevate',
  'seamless',
  'unleash',
  'next-gen',
  'game-changer',
  'delve',
  // Ad-style imperatives we don't ship in lifecycle copy:
  'click here',
  'limited time',
  'act now',
] as const

const RENDER_FIXTURES = [
  ScreenerResultsEmail({ resultsUrl: 'https://example.com/r/abc' }),
  ScreenerNudge24hEmail({
    resultsUrl: 'https://example.com/r/abc',
    howItWorksUrl: 'https://example.com/how-it-works',
  }),
  ScreenerNudge72hEmail({ resultsUrl: 'https://example.com/r/abc' }),
  RecoveryPurchasedEmail({
    caseUrl: 'https://example.com/app/case/cas_x/recovery',
  }),
  RecoveryMissingDocsEmail({
    caseUrl: 'https://example.com/app/case/cas_x/recovery',
    scheduleCallUrl: 'https://example.com/book',
  }),
  EntryListReadyEmail({
    caseUrl: 'https://example.com/app/case/cas_x/recovery',
    entryCount: 42,
  }),
  PrepReadyEmail({
    readinessReportUrl: 'https://example.com/app/case/cas_x/prep',
    conciergeUpgradeUrl: 'https://example.com/concierge',
  }),
  ConciergeUpsellEmail({
    conciergePurchaseUrl: 'https://example.com/concierge/buy',
  }),
  ReengagementEmail({
    caseUrl: 'https://example.com/app/case/cas_x',
  }),
] as const

describe('lifecycle templates — governance baseline', () => {
  it('every v1 lifecycle template file exists in src/shared/infra/email/templates/', () => {
    const files = new Set(readdirSync(TEMPLATES_DIR))
    for (const required of REQUIRED_TEMPLATES) {
      expect(files.has(required), `missing template: ${required}`).toBe(true)
    }
  })

  it('every template imports EmailLayout (canonical disclosure wrap)', () => {
    for (const filename of REQUIRED_TEMPLATES) {
      const source = readFileSync(join(TEMPLATES_DIR, filename), 'utf8')
      expect(
        /EmailLayout/.test(source),
        `template ${filename} does not wrap EmailLayout — disclosure may be missing`,
      ).toBe(true)
    }
  })

  it('no template contains AI copywriting clichés or ad-style imperatives', () => {
    for (const filename of REQUIRED_TEMPLATES) {
      const source = readFileSync(join(TEMPLATES_DIR, filename), 'utf8').toLowerCase()
      for (const banned of BANNED_WORDS) {
        expect(
          source.includes(banned),
          `template ${filename} contains banned word "${banned}"`,
        ).toBe(false)
      }
    }
  })

  it('rendered HTML contains the canonical "Not legal advice" disclosure for every template', async () => {
    for (let i = 0; i < RENDER_FIXTURES.length; i++) {
      const html = await render(RENDER_FIXTURES[i] as React.ReactElement, { plainText: false })
      expect(
        /not legal advice/i.test(html),
        `rendered template #${i} (${REQUIRED_TEMPLATES[i]}) is missing the disclosure`,
      ).toBe(true)
    }
  })

  it('no template uses an image-only body (real-text content required)', async () => {
    for (let i = 0; i < RENDER_FIXTURES.length; i++) {
      const html = await render(RENDER_FIXTURES[i] as React.ReactElement, { plainText: false })
      // Strip everything between tags; confirm there is at least 200
      // chars of real text.
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      expect(
        text.length,
        `rendered template #${i} (${REQUIRED_TEMPLATES[i]}) appears to be image-only or near-empty (${text.length} chars)`,
      ).toBeGreaterThan(200)
    }
  })

  it('plain-text rendering is non-empty for every template (lifecycle clients require text/plain alternative)', async () => {
    for (let i = 0; i < RENDER_FIXTURES.length; i++) {
      const text = await render(RENDER_FIXTURES[i] as React.ReactElement, { plainText: true })
      expect(
        text.trim().length,
        `plain-text render of #${i} (${REQUIRED_TEMPLATES[i]}) is empty`,
      ).toBeGreaterThan(80)
    }
  })

  it('every plain-text render contains the disclosure (so non-HTML clients still see it)', async () => {
    for (let i = 0; i < RENDER_FIXTURES.length; i++) {
      const text = await render(RENDER_FIXTURES[i] as React.ReactElement, { plainText: true })
      expect(
        /not legal advice/i.test(text),
        `plain-text render of #${i} (${REQUIRED_TEMPLATES[i]}) is missing the disclosure`,
      ).toBe(true)
    }
  })
})
