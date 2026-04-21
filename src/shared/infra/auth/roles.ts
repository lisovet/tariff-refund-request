import type { StaffRole } from './actor'

/**
 * Canonical staff role enum + ranking. Used by middleware (gate /ops),
 * the can() helper, and ops UX (sort dashboards, label priority).
 *
 * Permission decisions live in can(), not in the rank — analyst and
 * validator do different work, not strictly hierarchical.
 */

export const STAFF_ROLES = [
  'coordinator',
  'analyst',
  'validator',
  'admin',
] as const satisfies readonly StaffRole[]

const RANK: Record<StaffRole, number> = {
  coordinator: 1,
  analyst: 2,
  validator: 3,
  admin: 4,
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value)
}

// Clerk emits org_role as "org:<key>" for both system roles (org:admin)
// and custom roles (org:analyst). Strip the namespace before matching.
export function normalizeOrgRole(claim: unknown): string | null {
  if (typeof claim !== 'string' || claim.length === 0) return null
  return claim.startsWith('org:') ? claim.slice(4) : claim
}

export function staffRoleRank(role: StaffRole): number {
  return RANK[role]
}

export function hasAtLeastRole(role: StaffRole, atLeast: StaffRole): boolean {
  return RANK[role] >= RANK[atLeast]
}
