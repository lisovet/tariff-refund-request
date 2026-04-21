/**
 * Stripe catalog sync — task #35.
 *
 * Reconciles `pricing.ts` against Stripe products + prices. Idempotent:
 * a second run on the same code is a no-op. Old prices are archived,
 * never deleted.
 *
 * Usage:
 *   npm run stripe:sync                # apply
 *   npm run stripe:sync -- --dry-run   # plan only
 *
 * Requires STRIPE_SECRET_KEY (test or live mode). When missing the
 * script logs a clear notice and exits 0 — useful for CI smoke runs
 * without secrets.
 */

import {
  executeCatalogPlan,
  planCatalogSync,
} from '@contexts/billing'
import {
  createStripeCatalogClient,
  getStripeClient,
  loadStripeCatalogSnapshot,
} from '@contexts/billing/server'

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const hasKey = Boolean(process.env.STRIPE_SECRET_KEY)

  if (!hasKey) {
    console.log('[stripe:sync] STRIPE_SECRET_KEY missing — skipping live sync.')
    console.log('[stripe:sync] To exercise locally, set STRIPE_SECRET_KEY=sk_test_...')
    return
  }

  const stripe = getStripeClient()
  console.log('[stripe:sync] loading current Stripe catalog snapshot…')
  const snapshot = await loadStripeCatalogSnapshot(stripe)
  console.log(`[stripe:sync] snapshot: ${snapshot.products.length} owned products.`)

  const plan = planCatalogSync(snapshot)

  if (plan.diff.length === 0) {
    console.log('[stripe:sync] no diff — Stripe is in sync with pricing.ts.')
    return
  }

  console.log('[stripe:sync] diff:')
  for (const line of plan.diff) console.log(`  ${line}`)

  if (dryRun) {
    console.log('[stripe:sync] --dry-run: not applying.')
    return
  }

  console.log('[stripe:sync] applying…')
  const client = createStripeCatalogClient(stripe)
  const result = await executeCatalogPlan(plan, client)
  console.log('[stripe:sync] done:')
  console.log(
    `  products: created=${result.applied.products.created} archived=${result.applied.products.archived}`,
  )
  console.log(
    `  prices:   created=${result.applied.prices.created} archived=${result.applied.prices.archived}`,
  )
}

main().catch((err: unknown) => {
  console.error('[stripe:sync] failed:', err)
  process.exit(1)
})
