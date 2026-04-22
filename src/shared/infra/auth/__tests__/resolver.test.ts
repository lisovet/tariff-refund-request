import { describe, expect, it } from 'vitest'
import { type ClerkSessionShape, resolveActorFromSession } from '../resolver'
import { isAnonymous, isCustomer, isStaff } from '../actor'

/**
 * Resolver = Clerk session → Actor mapping. Pure function so we can
 * test the matrix without spinning Clerk up. The thin Next-runtime
 * wrapper that calls auth() → resolveActorFromSession() lives in the
 * same module and is exercised by the route-handler integration test.
 */

const baseSession: ClerkSessionShape = {
  userId: 'user_123',
  email: 'a@b.co',
  sessionClaims: {},
}

describe('resolveActorFromSession', () => {
  it('returns AnonymousActor when there is no userId', () => {
    const actor = resolveActorFromSession({ userId: null, email: null, sessionClaims: {} })
    expect(isAnonymous(actor)).toBe(true)
  })

  it('returns a CustomerActor for a session with no org_role', () => {
    const actor = resolveActorFromSession(baseSession)
    expect(isCustomer(actor)).toBe(true)
    if (!isCustomer(actor)) throw new Error('type guard failed')
    expect(actor.clerkUserId).toBe('user_123')
    expect(actor.email).toBe('a@b.co')
    // task #11 will replace this with the local customers.id; for now
    // we surface the clerk id so downstream code can reference it.
    expect(actor.id).toBe('user_123')
  })

  it('returns a StaffActor when orgRole matches a known staff role (v1 token shape)', () => {
    // v1 Clerk tokens surface orgRole with the "org:" prefix.
    const actor = resolveActorFromSession({
      ...baseSession,
      orgRole: 'org:analyst',
      sessionClaims: { org_name: 'Tariff Refund Staff' },
      fullName: 'A. Analyst',
    })
    expect(isStaff(actor)).toBe(true)
    if (!isStaff(actor)) throw new Error('type guard failed')
    expect(actor.role).toBe('analyst')
    expect(actor.name).toBe('A. Analyst')
  })

  it('returns a StaffActor when orgRole is bare (v2 token shape)', () => {
    // v2 Clerk tokens drop the "org:" prefix and surface bare role keys.
    const actor = resolveActorFromSession({
      ...baseSession,
      orgRole: 'admin',
    })
    expect(isStaff(actor)).toBe(true)
    if (!isStaff(actor)) throw new Error('type guard failed')
    expect(actor.role).toBe('admin')
  })

  it('falls back to CustomerActor when orgRole is set but unrecognized', () => {
    // Defensive: Clerk org could have any role; we only honor known ones.
    const actor = resolveActorFromSession({
      ...baseSession,
      orgRole: 'org:spectator',
    })
    expect(isCustomer(actor)).toBe(true)
  })

  it('falls back to "Unknown" name when fullName is missing', () => {
    const actor = resolveActorFromSession({
      ...baseSession,
      orgRole: 'org:admin',
      fullName: null,
    })
    if (!isStaff(actor)) throw new Error('type guard failed')
    expect(actor.name).toBe('Unknown')
  })

  it('treats email as required for a customer; throws when missing', () => {
    expect(() =>
      resolveActorFromSession({ userId: 'user_x', email: null, sessionClaims: {} }),
    ).toThrow(/email/i)
  })
})
