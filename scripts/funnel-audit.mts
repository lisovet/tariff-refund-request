/**
 * One-off funnel audit. Drives a real browser through the public flow
 * against a deployed environment, captures every dead end, and
 * reports findings to stderr.
 *
 * Usage: BASE=https://tariffrefundrequest.com tsx scripts/funnel-audit.mts
 *
 * Safety: does NOT submit the screener or trigger any write-path API.
 * Walks the UI up to the submit boundary, then stops.
 */

import { chromium, type Page, type Response } from 'playwright'

const BASE = process.env.BASE ?? 'https://tariffrefundrequest.com'

interface Finding {
  readonly severity: 'ok' | 'warn' | 'fail'
  readonly surface: string
  readonly note: string
  readonly evidence?: string
}

const findings: Finding[] = []
const consoleErrors: Array<{ surface: string; text: string }> = []
const failedRequests: Array<{ surface: string; url: string; status: number }> = []

function log(f: Finding) {
  findings.push(f)
  const tag = f.severity === 'ok' ? 'OK' : f.severity.toUpperCase()
  console.error(`[${tag}] ${f.surface} — ${f.note}${f.evidence ? ` :: ${f.evidence}` : ''}`)
}

function attachReporters(page: Page, surface: string) {
  page.on('console', (m) => {
    if (m.type() === 'error' && !/script-src/.test(m.text())) {
      consoleErrors.push({ surface, text: m.text() })
    }
  })
  page.on('response', (r: Response) => {
    if (r.status() >= 400 && r.url().startsWith(BASE)) {
      failedRequests.push({ surface, url: r.url(), status: r.status() })
    }
  })
}

async function gotoAndCheck(page: Page, path: string, label: string): Promise<number> {
  attachReporters(page, label)
  const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 25_000 })
  const status = resp?.status() ?? 0
  if (status >= 400) log({ severity: 'fail', surface: label, note: `${status} at ${path}` })
  else log({ severity: 'ok', surface: label, note: `${status} at ${path}` })
  return status
}

async function describeCtas(page: Page, surface: string, limit = 6): Promise<void> {
  // Capture the primary CTA-looking elements (accent buttons, buy/start/go copy)
  const ctas = await page.$$eval('a, button', (els) =>
    els
      .map((e) => {
        const text = (e.textContent ?? '').trim()
        const href = (e as HTMLAnchorElement).getAttribute('href') ?? null
        const tag = e.tagName
        const cls = (e as HTMLElement).className ?? ''
        // CTA heuristic: visible action text OR accent class
        if (!text) return null
        if (
          /buy|checkout|purchase|start|get started|open|begin|see (your )?options|choose|upgrade|contact|talk/i.test(
            text,
          ) ||
          /accent|primary|solid/i.test(cls)
        ) {
          return { text: text.slice(0, 60), href, tag }
        }
        return null
      })
      .filter(Boolean),
  )
  log({
    severity: 'ok',
    surface: `cta:${surface}`,
    note: `${ctas.length} CTAs`,
    evidence: JSON.stringify(ctas.slice(0, limit)),
  })
}

async function walkScreener(page: Page, mode: 'qualify' | 'disqualify'): Promise<void> {
  const surface = `screener-${mode}`
  await page.goto(`${BASE}/screener`, { waitUntil: 'networkidle' })
  attachReporters(page, surface)

  // The disqualify path exits quickly on Q1="No" per the e2e test.
  // The qualify path needs us to thread through every question.

  const log_q = (q: number, prompt: string, options: string[], chose: string) => {
    log({
      severity: 'ok',
      surface,
      note: `Q${q}: chose "${chose}"`,
      evidence: JSON.stringify({ prompt: prompt.slice(0, 80), options }),
    })
  }

  for (let q = 1; q <= 20; q += 1) {
    // Stop if we reached results
    const resultsHeading = await page
      .locator('h1')
      .filter({ hasText: /not a fit|fit|screener results|welcome/i })
      .first()
      .isVisible()
      .catch(() => false)
    if (resultsHeading) {
      const headingText = await page.locator('h1').first().textContent()
      log({
        severity: 'ok',
        surface,
        note: `results page reached at Q${q}: "${(headingText ?? '').trim()}"`,
      })
      await describeCtas(page, surface)
      return
    }

    // Capture this question's options
    const heading =
      (await page.locator('h1, h2').first().textContent().catch(() => '')) ?? ''
    const options = await page
      .locator('button:visible, [role="radio"]:visible, [role="option"]:visible')
      .evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()).filter(Boolean))

    // Pick an option per mode
    let chosen: string | null = null
    if (mode === 'disqualify' && q === 1) {
      // Q1 "No" → disqualifies per the e2e test
      const noBtn = page.getByRole('button', { name: /^no$/i }).first()
      if (await noBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        chosen = 'No'
        await noBtn.click()
      }
    }

    if (!chosen) {
      // Qualify strategy: pick the first visible answer button that is NOT
      // the "back" / "start over" / keyboard-hint affordance.
      const banned = /^(back|previous|start over|restart|next|continue|skip|\?)$/i
      const answerBtns = await page
        .locator('button:visible')
        .evaluateAll((els) =>
          els
            .map((e, i) => ({
              i,
              text: (e.textContent ?? '').trim(),
              disabled: (e as HTMLButtonElement).disabled,
            }))
            .filter((r) => r.text && !r.disabled),
        )
      const candidate = answerBtns.find(
        (b) =>
          !banned.test(b.text) &&
          // Prefer the first "Yes" style answer, or any short answer not "No"
          b.text.length > 0,
      )

      if (candidate) {
        chosen = candidate.text
        const allBtns = await page.locator('button:visible').all()
        await allBtns[candidate.i].click()
      } else {
        // Try text / number input
        const input = page
          .locator('input[type="number"], input[type="text"], input:not([type]), textarea')
          .first()
        if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
          await input.fill('50')
          const nextBtn = page.getByRole('button', { name: /next|continue|submit/i }).first()
          if (await nextBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            chosen = '50 → Next'
            await nextBtn.click()
          }
        }
      }
    }

    if (!chosen) {
      log({
        severity: 'warn',
        surface,
        note: `Q${q}: no advance path found`,
        evidence: JSON.stringify({ heading, options: options.slice(0, 6) }),
      })
      return
    }

    log_q(q, heading, options.slice(0, 6), chosen)

    // Check: if the next visible button is a submit/results one, do NOT click it.
    await page.waitForTimeout(400)
    const submitVisible = await page
      .getByRole('button', { name: /see (my )?results|submit|complete|finalize/i })
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false)
    if (submitVisible) {
      log({
        severity: 'ok',
        surface,
        note: `reached submit step at Q${q + 1} — stopping before write`,
      })
      await describeCtas(page, surface)
      return
    }
  }

  log({ severity: 'warn', surface, note: 'walked 20 questions without reaching results' })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'funnel-audit-bot/claude',
  })
  const page = await ctx.newPage()

  console.error(`\nauditing ${BASE}\n`)

  // 1. Core routes
  const routes = [
    '/',
    '/how-it-works',
    '/recovery',
    '/cape-prep',
    '/concierge',
    '/for-agencies',
    '/pricing',
    '/trust',
    '/trust/security',
    '/trust/sub-processors',
    '/screener',
    '/app',
    '/ops',
    '/sign-in',
    '/sign-up',
  ]
  for (const r of routes) await gotoAndCheck(page, r, `route:${r}`)

  // 2. CTA inventory on key pages
  for (const path of ['/', '/pricing', '/concierge', '/how-it-works', '/recovery', '/cape-prep']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await describeCtas(page, path)
  }

  // 3. Walk the screener — disqualify path
  await walkScreener(page, 'disqualify')

  // 4. Walk the screener — qualify path
  await walkScreener(page, 'qualify')

  // 5. Auth-gated routes (note the Clerk redirect_url)
  for (const p of ['/app', '/ops']) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'load', timeout: 15_000 })
    log({
      severity: 'ok',
      surface: `auth-redirect:${p}`,
      note: `unauth → ${page.url()}`,
    })
  }

  // 6. Check whether /pricing has a working buy button
  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' })
  const pricingButtons = await page
    .locator('a, button')
    .evaluateAll((els) =>
      els
        .map((e) => ({
          text: (e.textContent ?? '').trim().slice(0, 60),
          href: (e as HTMLAnchorElement).getAttribute('href') ?? null,
          onclick: (e as HTMLElement).getAttribute('onclick') ?? null,
        }))
        .filter((r) => /buy|purchase|checkout|start|get|go|open/i.test(r.text)),
    )
  log({
    severity: 'ok',
    surface: 'pricing:buy-ctas',
    note: `${pricingButtons.length} buy-ish CTAs on /pricing`,
    evidence: JSON.stringify(pricingButtons.slice(0, 10)),
  })

  // 7. Report
  console.error('\n-- console errors (non-CSP-warning) --')
  for (const e of consoleErrors) console.error(`  [${e.surface}] ${e.text.slice(0, 300)}`)
  console.error('\n-- failed requests --')
  for (const f of failedRequests) console.error(`  [${f.surface}] ${f.status} ${f.url}`)

  console.error('\n-- findings summary --')
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1
    return acc
  }, {})
  console.error(`  ok:${counts.ok ?? 0}  warn:${counts.warn ?? 0}  fail:${counts.fail ?? 0}`)

  await browser.close()
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
