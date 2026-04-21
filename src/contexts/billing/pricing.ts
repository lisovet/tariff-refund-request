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

export const SUCCESS_FEE_RATES: Readonly<Record<PricingTier, FractionRange>> = {
  smb: { min: 0.10, max: 0.12 },
  mid_market: { min: 0.08, max: 0.10 },
} as const

/**
 * Per PRD 06: caps the success fee so we never bill more than the
 * refund makes reasonable. A blanket dollar cap is the simplest
 * defensible policy — if a future case warrants more, it's a
 * deliberate ladder change, not a quiet drift.
 */
export const SUCCESS_FEE_HARD_CAP: MoneyCents = { usdCents: 50_000_00 }

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
