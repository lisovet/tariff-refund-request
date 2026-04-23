import { describe, expect, it } from 'vitest'
import { TIER_ORDER } from '../tiers'
import {
  CUSTOMER_FACING_SKUS,
  TIER_TO_SKU,
  isCustomerFacingSku,
  skuForTier,
} from '../tier-sku-bridge'

describe('tier-sku-bridge', () => {
  it('maps every customer-facing tier to a concrete SKU', () => {
    for (const tier of TIER_ORDER) {
      expect(TIER_TO_SKU[tier]).toBeDefined()
    }
  })

  it('Audit resolves to recovery_kit ($99 SMB)', () => {
    expect(skuForTier('audit')).toBe('recovery_kit')
  })

  it('Full Prep resolves to concierge_base ($999 SMB + success fee)', () => {
    expect(skuForTier('full_prep')).toBe('concierge_base')
  })

  it('the allowlist contains exactly the two tier-mapped SKUs', () => {
    expect([...CUSTOMER_FACING_SKUS].sort()).toEqual(
      ['concierge_base', 'recovery_kit'].sort(),
    )
  })

  it('every TIER_TO_SKU value is in the customer-facing allowlist', () => {
    for (const sku of Object.values(TIER_TO_SKU)) {
      expect(isCustomerFacingSku(sku)).toBe(true)
    }
  })

  it('rejects the four hidden middle-ladder SKUs', () => {
    for (const sku of [
      'recovery_service',
      'cape_prep_standard',
      'cape_prep_premium',
      'monitoring',
    ] as const) {
      expect(isCustomerFacingSku(sku)).toBe(false)
    }
  })
})
