import { describe, expect, it } from 'vitest'
import {
  STAFF_ROLES,
  isStaffRole,
  staffRoleRank,
  hasAtLeastRole,
} from '../roles'

/**
 * Role enum + ranking.
 *
 * Per ADR 004 + PRD 04: staff roles are coordinator, analyst,
 * validator, admin. Roles are not strictly hierarchical (analyst and
 * validator do different work), but `admin` outranks them all and
 * coordinator is the entry-level role used for triage. The ranking
 * helps with UX-only decisions (sort dashboards, label priority);
 * permission checks live in `can()`, not here.
 */

describe('STAFF_ROLES', () => {
  it('contains exactly the four canonical roles', () => {
    expect(new Set(STAFF_ROLES)).toEqual(
      new Set(['coordinator', 'analyst', 'validator', 'admin']),
    )
  })

  it('isStaffRole accepts valid + rejects invalid', () => {
    expect(isStaffRole('admin')).toBe(true)
    expect(isStaffRole('analyst')).toBe(true)
    expect(isStaffRole('owner')).toBe(false)
    expect(isStaffRole('')).toBe(false)
  })

  it('staffRoleRank places admin highest, coordinator lowest', () => {
    expect(staffRoleRank('admin')).toBeGreaterThan(staffRoleRank('validator'))
    expect(staffRoleRank('validator')).toBeGreaterThan(staffRoleRank('analyst'))
    expect(staffRoleRank('analyst')).toBeGreaterThan(staffRoleRank('coordinator'))
  })

  it('hasAtLeastRole compares ranks', () => {
    expect(hasAtLeastRole('admin', 'analyst')).toBe(true)
    expect(hasAtLeastRole('analyst', 'admin')).toBe(false)
    expect(hasAtLeastRole('validator', 'validator')).toBe(true)
  })
})
