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

  it('returns a StaffActor when org_role matches a known staff role', () => {
    // Clerk emits the "org:" prefix — real prod sessions look like this.
    const actor = resolveActorFromSession({
      ...baseSession,
      sessionClaims: { org_role: 'org:analyst', org_name: 'Tariff Refund Staff' },
      fullName: 'A. Analyst',
    })
    expect(isStaff(actor)).toBe(true)
    if (!isStaff(actor)) throw new Error('type guard failed')
    expect(actor.role).toBe('analyst')
    expect(actor.name).toBe('A. Analyst')
  })

  it('accepts a bare org_role without the "org:" prefix (defense in depth)', () => {
    const actor = resolveActorFromSession({
      ...baseSession,
      sessionClaims: { org_role: 'analyst' },
    })
    expect(isStaff(actor)).toBe(true)
    if (!isStaff(actor)) throw new Error('type guard failed')
    expect(actor.role).toBe('analyst')
  })

  it('falls back to CustomerActor when org_role is set but unrecognized', () => {
    // Defensive: Clerk org could have any role; we only honor known ones.
    const actor = resolveActorFromSession({
      ...baseSession,
      sessionClaims: { org_role: 'org:spectator' },
    })
    expect(isCustomer(actor)).toBe(true)
  })

  it('falls back to "Unknown" name when fullName is missing', () => {
    const actor = resolveActorFromSession({
      ...baseSession,
      sessionClaims: { org_role: 'org:admin' },
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
