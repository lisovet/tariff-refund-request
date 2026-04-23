/**
 * Two-tier commercial model (April 2026 repricing).
 *
 * Replaces the user-facing 3-stage ladder (`recovery_* / cape_prep /
 * concierge`) on the results + pricing surfaces. The underlying SKU
 * ladder in `pricing.ts` is NOT removed here — existing ops / billing
 * code continues to reference those SKUs — but the customer-facing
 * commercial object is now a single `Tier` per purchase intent.
 *
 * Kept copy verbatim from the approved marketing mockup. Keep the
 * structure dumb (strings + dollars-in-cents) so UI can render either
 * tier without knowing about the legacy ladder.
 */

export type TierId = 'audit' | 'full_prep'

export interface Tier {
  readonly id: TierId
  readonly name: string
  readonly eyebrow: string
  readonly flatUsdCents: number
  /** Undefined when no success fee applies. */
  readonly successFeePct?: number
  /** Hard cap on the success fee, expressed in cents. */
  readonly successFeeCapUsdCents?: number
  /** One-sentence pitch rendered under the price. */
  readonly pitch: string
  /** What's included — rendered as a hairline-divided list. */
  readonly included: readonly string[]
  /** What's NOT included (the upgrade wedge). Optional. */
  readonly notIncluded?: readonly string[]
  /** Short CTA label, e.g. "Pay — $99". */
  readonly ctaLabelShort: string
  /** Accessible CTA label, e.g. "Pay — $99 · start Audit". */
  readonly ctaLabelAccessible: string
}

export const TIERS: Readonly<Record<TierId, Tier>> = {
  audit: {
    id: 'audit',
    name: 'Audit',
    eyebrow: 'Tier 01 · Self-serve',
    flatUsdCents: 9_900,
    pitch:
      "Find out if you're eligible, how much you could get back, and exactly what you need to do. You take it from here.",
    included: [
      'Eligibility determination — Phase 1 vs Phase 2 verdict with confidence level',
      'Estimated refund range — based on your duty amounts and import dates',
      "Country + category analysis — which imports qualify and which don't",
      'Personalized checklist — step-by-step of exactly what to gather and do',
      'Broker outreach email template — pre-written, ready to send',
      'ACE portal setup guide — how to register and enroll ACH banking',
      "CAPE CSV spec — the exact format so you know what you're building toward",
    ],
    notIncluded: [
      'Document review or entry number extraction',
      'CSV building and validation',
      'Pre-submission confidence report',
      'VA-assisted file prep',
    ],
    ctaLabelShort: 'Pay — $99',
    ctaLabelAccessible: 'Pay — $99 · start Audit',
  },
  full_prep: {
    id: 'full_prep',
    name: 'Full Prep',
    eyebrow: 'Tier 02 · Done for you',
    flatUsdCents: 99_900,
    successFeePct: 0.1,
    successFeeCapUsdCents: 2_500_000,
    pitch:
      "We do everything except hit submit. You get a validated, submission-ready CAPE file. You log into ACE and upload it.",
    included: [
      'Document collection management — we follow up with your broker or carrier until we have what we need',
      'Entry number extraction — VA reviews all docs and pulls every entry number',
      'Full CAPE CSV built for you — formatted, validated, split if needed, ready to upload',
      'Phase 1 / Phase 2 separation — Phase 1 file ready now, Phase 2 saved for next window',
      'Pre-submission confidence report — plain-English summary, flags, and expected timeline',
      'ACE upload walkthrough — guided steps so nothing goes wrong at submission',
      'Phase 2 follow-up — we hold your entries and re-engage when the window opens',
      '5-day turnaround SLA — from documents received to file delivered',
    ],
    ctaLabelShort: 'Pay — $999 + fee',
    ctaLabelAccessible: 'Pay — $999 plus success fee · start Full Prep',
  },
} as const

export const TIER_ORDER: readonly TierId[] = ['audit', 'full_prep'] as const

export function isTierId(value: unknown): value is TierId {
  return value === 'audit' || value === 'full_prep'
}
