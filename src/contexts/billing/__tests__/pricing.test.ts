import { describe, expect, it } from 'vitest'
import {
  PRICE_LADDER,
  SUCCESS_FEE_RATES,
  computeSuccessFeeCents,
  determineTier,
  priceFor,
  type Sku,
} from '../pricing'

describe('PRICE_LADDER — canonical SKUs per PRD 06', () => {
  it('exposes every v1 SKU', () => {
    const expected: readonly Sku[] = [
      'recovery_kit',
      'recovery_service',
      'cape_prep_standard',
      'cape_prep_premium',
      'concierge_base',
      'monitoring',
    ]
    for (const sku of expected) {
      expect(PRICE_LADDER).toHaveProperty(sku)
    }
  })

  it.each([
    ['recovery_kit', 'smb', 99_00],
    ['recovery_kit', 'mid_market', 299_00],
    ['recovery_service', 'smb', 299_00],
    ['recovery_service', 'mid_market', 499_00],
    ['cape_prep_standard', 'smb', 199_00],
    ['cape_prep_standard', 'mid_market', 499_00],
    ['cape_prep_premium', 'smb', 499_00],
    ['cape_prep_premium', 'mid_market', 999_00],
    ['concierge_base', 'smb', 999_00],
    ['concierge_base', 'mid_market', 1_999_00],
    ['monitoring', 'smb', 299_00],
    ['monitoring', 'mid_market', 999_00],
  ] as const)('priceFor(%s, %s) === %d cents', (sku, tier, expected) => {
    expect(priceFor(sku, tier).usdCents).toBe(expected)
  })
})

describe('SUCCESS_FEE_RATES — per PRD 06', () => {
  it('SMB: 10–12%', () => {
    expect(SUCCESS_FEE_RATES.smb).toEqual({ min: 0.10, max: 0.12 })
  })
  it('mid-market: 8–10%', () => {
    expect(SUCCESS_FEE_RATES.mid_market).toEqual({ min: 0.08, max: 0.10 })
  })
})

describe('determineTier', () => {
  it('SMB when entry count and duty are both small', () => {
    expect(determineTier({ entryCount: 50, dutyAmountUsdCents: 10_000_00 })).toBe(
      'smb',
    )
  })

  it('mid-market when entry count exceeds the 100 threshold', () => {
    expect(determineTier({ entryCount: 150, dutyAmountUsdCents: 10_000_00 })).toBe(
      'mid_market',
    )
  })

  it('mid-market when duty exceeds the $50k threshold', () => {
    expect(determineTier({ entryCount: 50, dutyAmountUsdCents: 60_000_00 })).toBe(
      'mid_market',
    )
  })

  it('treats the boundary values as SMB (strict >, not ≥)', () => {
    expect(determineTier({ entryCount: 100, dutyAmountUsdCents: 50_000_00 })).toBe(
      'smb',
    )
  })

  it('returns mid-market only when at least one threshold is exceeded', () => {
    expect(determineTier({ entryCount: 101, dutyAmountUsdCents: 0 })).toBe(
      'mid_market',
    )
    expect(determineTier({ entryCount: 0, dutyAmountUsdCents: 50_000_01 })).toBe(
      'mid_market',
    )
  })
})

describe('computeSuccessFeeCents', () => {
  it('uses the rate parameter clamped to the tier band', () => {
    // SMB band is 10–12%. 11% on $10,000 refund = $1,100 = 110_000 cents.
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 10_000_00,
        tier: 'smb',
        rate: 0.11,
      }),
    ).toBe(110_000)
  })

  it('clamps a too-low rate up to the tier minimum', () => {
    // SMB minimum = 10%. Caller asks for 5% → use 10%.
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 10_000_00,
        tier: 'smb',
        rate: 0.05,
      }),
    ).toBe(100_000)
  })

  it('clamps a too-high rate down to the tier maximum', () => {
    // SMB max = 12%. Caller asks for 20% → use 12%.
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 10_000_00,
        tier: 'smb',
        rate: 0.20,
      }),
    ).toBe(120_000)
  })

  it('defaults to the tier minimum when no rate is supplied', () => {
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 10_000_00,
        tier: 'smb',
      }),
    ).toBe(100_000)
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 10_000_00,
        tier: 'mid_market',
      }),
    ).toBe(80_000)
  })

  it('caps the fee at the per-case ladder maximum (per PRD 06: never bill more than the refund makes reasonable)', () => {
    // Hard cap at $50k = 5_000_000 cents — on a $1M refund at 12%, raw
    // fee would be $120k; clamped to $50k.
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 1_000_000_00,
        tier: 'smb',
        rate: 0.12,
      }),
    ).toBe(5_000_000)
  })

  it('rounds to whole cents (no fractional cents)', () => {
    // $1,234.56 refund at 11% = $135.8016 → 13580 cents.
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 1234_56,
        tier: 'smb',
        rate: 0.11,
      }),
    ).toBe(13_580)
  })

  it('returns 0 on a zero or negative refund', () => {
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: 0,
        tier: 'smb',
      }),
    ).toBe(0)
    expect(
      computeSuccessFeeCents({
        refundAmountUsdCents: -100,
        tier: 'smb',
      }),
    ).toBe(0)
  })
})
