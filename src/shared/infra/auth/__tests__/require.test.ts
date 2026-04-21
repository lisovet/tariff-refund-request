import { describe, expect, it } from 'vitest'
import { AnonymousActor, type Actor } from '../actor'
import {
  AuthorizationError,
  AuthenticationError,
  requireActor,
  requireCan,
  requireStaff,
} from '../require'

const customer: Actor = {
  kind: 'customer',
  id: 'cus_x',
  clerkUserId: 'user_x',
  email: 'a@b.co',
}
const validator: Actor = {
  kind: 'staff',
  id: 'stf_v',
  clerkUserId: 'user_v',
  role: 'validator',
  name: 'V. Validator',
}

describe('requireActor', () => {
  it('returns the actor when authenticated', () => {
    expect(requireActor(customer)).toBe(customer)
    expect(requireActor(validator)).toBe(validator)
  })

  it('throws AuthenticationError on AnonymousActor', () => {
    expect(() => requireActor(AnonymousActor)).toThrow(AuthenticationError)
  })
})

describe('requireCan', () => {
  it('returns the actor when can() permits', () => {
    expect(requireCan(validator, 'qa.signoff')).toBe(validator)
  })

  it('throws AuthorizationError when can() denies', () => {
    expect(() => requireCan(customer, 'qa.signoff')).toThrow(AuthorizationError)
  })

  it('throws AuthenticationError before AuthorizationError on anonymous', () => {
    // Action is staff-only; anon should fail at the auth check first so
    // the route returns 401, not 403 (different remediation for the user).
    expect(() => requireCan(AnonymousActor, 'qa.signoff')).toThrow(AuthenticationError)
  })

  it('lets anonymous through for actions that anon may do', () => {
    expect(requireCan(AnonymousActor, 'screener.complete')).toBe(AnonymousActor)
  })
})

describe('requireStaff', () => {
  it('accepts a staff actor and returns it narrowed', () => {
    const result = requireStaff(validator)
    expect(result.role).toBe('validator')
  })

  it('rejects customers with AuthorizationError', () => {
    expect(() => requireStaff(customer)).toThrow(AuthorizationError)
  })

  it('rejects anonymous with AuthenticationError', () => {
    expect(() => requireStaff(AnonymousActor)).toThrow(AuthenticationError)
  })

  it('honors a minimum-role constraint', () => {
    expect(() => requireStaff(validator, 'admin')).toThrow(AuthorizationError)
    expect(() => requireStaff(validator, 'analyst')).not.toThrow()
  })
})

describe('AuthError HTTP status mapping', () => {
  it('AuthenticationError maps to 401', () => {
    const err = new AuthenticationError('not signed in')
    expect(err.status).toBe(401)
  })

  it('AuthorizationError maps to 403', () => {
    const err = new AuthorizationError('not allowed', 'qa.signoff')
    expect(err.status).toBe(403)
    expect(err.action).toBe('qa.signoff')
  })
})
