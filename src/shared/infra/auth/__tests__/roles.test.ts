import { describe, expect, it } from 'vitest'
import {
  STAFF_ROLES,
  isStaffRole,
  normalizeOrgRole,
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

describe('normalizeOrgRole', () => {
  it('strips the "org:" prefix Clerk emits', () => {
    expect(normalizeOrgRole('org:admin')).toBe('admin')
    expect(normalizeOrgRole('org:analyst')).toBe('analyst')
  })

  it('passes through a bare role key unchanged', () => {
    expect(normalizeOrgRole('admin')).toBe('admin')
  })

  it('returns null for non-strings and empty strings', () => {
    expect(normalizeOrgRole(null)).toBeNull()
    expect(normalizeOrgRole(undefined)).toBeNull()
    expect(normalizeOrgRole('')).toBeNull()
    expect(normalizeOrgRole(42)).toBeNull()
  })

  it('only strips the "org:" prefix once', () => {
    // A role literally keyed "org:weird" would become "weird" — acceptable;
    // STAFF_ROLES is closed so unknowns still get rejected by isStaffRole.
    expect(normalizeOrgRole('org:org:weird')).toBe('org:weird')
  })
})
