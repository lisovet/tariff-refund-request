import 'server-only'
import Stripe from 'stripe'
import { createDbClient } from '@shared/infra/db/client'
import { createDrizzleBillingRepo } from './drizzle-repo'
import { createInMemoryBillingRepo } from './in-memory-repo'
import type { BillingRepo } from './repo'

/**
 * Server-only entry for the billing context. Route handlers + Inngest
 * workflows import from here; client code imports from
 * `@contexts/billing` (UI-safe surface).
 *
 * Provides:
 *   - getBillingRepo() — drizzle vs in-memory by DATABASE_URL.
 *   - getStripeClient() — singleton Stripe client. Throws if
 *     STRIPE_SECRET_KEY is missing in production. In dev/tests the
 *     client is constructed against a test-mode placeholder so
 *     verification works without real credentials.
 */

export { createInMemoryBillingRepo } from './in-memory-repo'
export { createDrizzleBillingRepo } from './drizzle-repo'

let cachedRepo: BillingRepo | undefined
let cachedClient: Stripe | undefined

export function getBillingRepo(): BillingRepo {
  if (cachedRepo) return cachedRepo
  if (process.env.DATABASE_URL) {
    cachedRepo = createDrizzleBillingRepo(createDbClient())
  } else {
    cachedRepo = createInMemoryBillingRepo()
  }
  return cachedRepo
}

export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is missing in production')
    }
    // Dev/tests — placeholder constructs the client without making
    // network calls. Webhook verification still requires the real
    // STRIPE_WEBHOOK_SECRET to be configured before Stripe can verify
    // signatures.
    cachedClient = new Stripe('sk_test_placeholder', {
      apiVersion: '2026-03-25.dahlia',
    })
    return cachedClient
  }
  cachedClient = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  return cachedClient
}

export function resetBilling(): void {
  cachedRepo = undefined
  cachedClient = undefined
}
