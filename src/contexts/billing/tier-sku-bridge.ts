/**
 * Bridge between the customer-facing tier catalog (`TIERS` in
 * `./tiers.ts`) and the backend SKU ladder (`Sku` in `./pricing.ts`).
 *
 * The tier catalog is what customers see on /pricing, /how-it-works,
 * the screener results page, and checkout buttons. The SKU ladder is
 * the internal pricing + Stripe catalog identifier space. The two
 * converged in April 2026 on a two-tier commercial model; this bridge
 * records that convergence without touching the legacy SKU ladder
 * itself (still used by ops state copy, email triggers, and Stripe
 * lookup keys).
 *
 * Mapping:
 *   - Tier 1 · Audit    → `recovery_kit`   ($99 smb)
 *   - Tier 2 · Full Prep → `concierge_base` ($999 smb + success fee)
 *
 * The four middle SKUs (`recovery_service`, `cape_prep_standard`,
 * `cape_prep_premium`, `monitoring`) remain price-defined and remain
 * in the Stripe catalog, but are NOT reachable from any customer-
 * facing checkout surface per `CUSTOMER_FACING_SKUS` below. The
 * /api/checkout route enforces the allowlist.
 */

import type { Sku } from './pricing'
import type { TierId } from './tiers'

/**
 * Canonical tier → SKU mapping for customer-initiated checkouts.
 * When a customer clicks "Select Tier 1" / "Select Tier 2", this is
 * the SKU that flows into Stripe metadata and downstream events.
 */
export const TIER_TO_SKU: Readonly<Record<TierId, Sku>> = {
  audit: 'recovery_kit',
  full_prep: 'concierge_base',
} as const

/**
 * Allowlist of SKUs that may originate from a customer-facing
 * checkout call. Anything outside this set is ops-only (internal
 * adjustments, legacy cases) and must not be reachable from the
 * public API.
 */
export const CUSTOMER_FACING_SKUS: readonly Sku[] = [
  'recovery_kit',
  'concierge_base',
] as const

export function skuForTier(tier: TierId): Sku {
  return TIER_TO_SKU[tier]
}

export function isCustomerFacingSku(sku: Sku): boolean {
  return CUSTOMER_FACING_SKUS.includes(sku)
}
