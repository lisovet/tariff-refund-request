/**
 * Pricing ladder per PRD 06.
 *
 * Pricing is product, not config — this module is the canonical
 * source of truth. The Stripe catalog sync script (task #35) reads
 * from here at deploy time and reconciles against the Stripe API.
 *
 * All amounts are stored in USD cents (Stripe's lingua franca).
 * Mid-market threshold (rough): >100 entries OR >$50k duty paid.
 */

export type PricingTier = 'smb' | 'mid_market'

export type Sku =
  | 'recovery_kit'
  | 'recovery_service'
  | 'cape_prep_standard'
  | 'cape_prep_premium'
  | 'concierge_base'
  | 'monitoring'

export interface MoneyCents {
  /** Whole cents — no fractional units. */
  readonly usdCents: number
}

export interface FractionRange {
  readonly min: number
  readonly max: number
}

export const PRICE_LADDER: Readonly<Record<Sku, Readonly<Record<PricingTier, MoneyCents>>>> = {
  recovery_kit: {
    smb: { usdCents: 99_00 },
    mid_market: { usdCents: 299_00 },
  },
  recovery_service: {
    smb: { usdCents: 299_00 },
    mid_market: { usdCents: 499_00 },
  },
  cape_prep_standard: {
    smb: { usdCents: 199_00 },
    mid_market: { usdCents: 499_00 },
  },
  cape_prep_premium: {
    smb: { usdCents: 499_00 },
    mid_market: { usdCents: 999_00 },
  },
  concierge_base: {
    smb: { usdCents: 999_00 },
    mid_market: { usdCents: 1_999_00 },
  },
  monitoring: {
    smb: { usdCents: 299_00 },
    mid_market: { usdCents: 999_00 },
  },
} as const

/**
 * Success fee rates per tier (April 2026 two-tier repricing).
 *
 * The customer promise on /pricing and /how-it-works is a flat 10%
 * of the estimated refund, capped at $25,000. Both bands are
 * intentionally degenerate `{min: 0.10, max: 0.10}` so the clamp in
 * `computeSuccessFeeCents` collapses to exactly 10% regardless of
 * what `rate` a caller requests — the customer sees one number and
 * internal code can't drift above or below it.
 *
 * Band shape is preserved (rather than collapsing to a scalar) so
 * the surrounding clamp/rounding logic and tests don't have to
 * change when / if ops wants to widen the band for a specific tier
 * again.
 */
export const SUCCESS_FEE_RATES: Readonly<Record<PricingTier, FractionRange>> = {
  smb: { min: 0.10, max: 0.10 },
  mid_market: { min: 0.10, max: 0.10 },
} as const

/**
 * Per the April 2026 tier catalog: caps the success fee at $25,000.
 * This is the number printed on /pricing, /how-it-works, and every
 * tier card. A cap higher than this (the previous $50k) would
 * silently violate the customer promise, so it's centralized here
 * and enforced by `computeSuccessFeeCents`.
 */
export const SUCCESS_FEE_HARD_CAP: MoneyCents = { usdCents: 25_000_00 }

const MID_MARKET_ENTRY_THRESHOLD = 100
const MID_MARKET_DUTY_THRESHOLD_CENTS = 50_000_00 // $50,000

export interface TierInput {
  readonly entryCount: number
  readonly dutyAmountUsdCents: number
}

export function determineTier(input: TierInput): PricingTier {
  if (input.entryCount > MID_MARKET_ENTRY_THRESHOLD) return 'mid_market'
  if (input.dutyAmountUsdCents > MID_MARKET_DUTY_THRESHOLD_CENTS) {
    return 'mid_market'
  }
  return 'smb'
}

export function priceFor(sku: Sku, tier: PricingTier): MoneyCents {
  return PRICE_LADDER[sku][tier]
}

export interface SuccessFeeInput {
  readonly refundAmountUsdCents: number
  readonly tier: PricingTier
  /** Optional negotiated rate. Clamped into the tier band [min, max]. */
  readonly rate?: number
}

export function computeSuccessFeeCents(input: SuccessFeeInput): number {
  if (input.refundAmountUsdCents <= 0) return 0

  const band = SUCCESS_FEE_RATES[input.tier]
  const requested = input.rate ?? band.min
  const rate = clamp(requested, band.min, band.max)

  const raw = input.refundAmountUsdCents * rate
  const rounded = Math.round(raw)
  return Math.min(rounded, SUCCESS_FEE_HARD_CAP.usdCents)
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}
