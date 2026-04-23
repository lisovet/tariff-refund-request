import { describe, expect, it } from 'vitest'
import { TIERS, TIER_ORDER, isTierId } from '../tiers'

describe('tier catalog', () => {
  it('exposes audit + full_prep in order', () => {
    expect(TIER_ORDER).toEqual(['audit', 'full_prep'])
  })

  it('audit has no success fee', () => {
    expect(TIERS.audit.flatUsdCents).toBe(9_900)
    expect(TIERS.audit.successFeePct).toBeUndefined()
    expect(TIERS.audit.successFeeCapUsdCents).toBeUndefined()
  })

  it('full_prep is $999 + 10% capped at $25,000', () => {
    expect(TIERS.full_prep.flatUsdCents).toBe(99_900)
    expect(TIERS.full_prep.successFeePct).toBe(0.1)
    expect(TIERS.full_prep.successFeeCapUsdCents).toBe(2_500_000)
  })

  it('audit lists the upgrade-wedge not-included items', () => {
    expect(TIERS.audit.notIncluded).toBeDefined()
    expect(TIERS.audit.notIncluded!.length).toBeGreaterThan(0)
  })

  it('full_prep does not advertise a "not included" list', () => {
    expect(TIERS.full_prep.notIncluded).toBeUndefined()
  })

  it('isTierId narrows correctly', () => {
    expect(isTierId('audit')).toBe(true)
    expect(isTierId('full_prep')).toBe(true)
    expect(isTierId('concierge')).toBe(false)
    expect(isTierId(undefined)).toBe(false)
  })
})
