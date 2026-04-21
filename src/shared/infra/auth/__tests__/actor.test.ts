import { describe, expect, it } from 'vitest'
import {
  type Actor,
  AnonymousActor,
  isAnonymous,
  isCustomer,
  isStaff,
} from '../actor'

/**
 * Actor type smoke tests for task #8. The full resolver (clerk →
 * Customer | StaffUser) lands in task #10; this PR establishes the
 * type surface so downstream code can begin importing it.
 */

describe('Actor type discriminants', () => {
  it('AnonymousActor singleton is anonymous', () => {
    expect(isAnonymous(AnonymousActor)).toBe(true)
    expect(isCustomer(AnonymousActor)).toBe(false)
    expect(isStaff(AnonymousActor)).toBe(false)
  })

  it('discriminates a customer actor', () => {
    const a: Actor = {
      kind: 'customer',
      id: 'cus_x',
      clerkUserId: 'user_x',
      email: 'a@b.co',
    }
    expect(isCustomer(a)).toBe(true)
    expect(isAnonymous(a)).toBe(false)
    expect(isStaff(a)).toBe(false)
  })

  it('discriminates a staff actor with role', () => {
    const a: Actor = {
      kind: 'staff',
      id: 'stf_x',
      clerkUserId: 'user_x',
      role: 'analyst',
      name: 'A. Analyst',
    }
    expect(isStaff(a)).toBe(true)
    expect(isAnonymous(a)).toBe(false)
    expect(isCustomer(a)).toBe(false)
  })
})
