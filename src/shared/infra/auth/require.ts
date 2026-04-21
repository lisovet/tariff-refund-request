import { type Action, can } from './can'
import { type Actor, type StaffActor, isAnonymous, isStaff } from './actor'
import { type StaffRole } from './actor'
import { hasAtLeastRole } from './roles'

/**
 * Authorization guards used by route handlers and context methods.
 *
 * - requireActor: returns the actor if authenticated; throws
 *   AuthenticationError (→ 401) on AnonymousActor.
 * - requireCan: combines requireActor + can(); throws
 *   AuthorizationError (→ 403) when the action is denied. Anonymous
 *   actors fail at the auth check first, except when the action is
 *   anon-permitted (e.g., screener.complete).
 * - requireStaff: narrows to StaffActor and optionally checks a
 *   minimum role rank.
 *
 * Errors carry HTTP status so route handlers can map them uniformly:
 *
 *   try { ... }
 *   catch (e) {
 *     if (e instanceof AuthError) return Response.json({ ... }, { status: e.status })
 *     throw e
 *   }
 */

export abstract class AuthError extends Error {
  abstract readonly status: 401 | 403
}

export class AuthenticationError extends AuthError {
  readonly status = 401 as const
  constructor(message = 'authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AuthError {
  readonly status = 403 as const
  readonly action?: Action
  constructor(message: string, action?: Action) {
    super(message)
    this.name = 'AuthorizationError'
    this.action = action
  }
}

export function requireActor(actor: Actor): Exclude<Actor, { kind: 'anonymous' }> {
  if (isAnonymous(actor)) {
    throw new AuthenticationError()
  }
  return actor
}

export function requireCan(actor: Actor, action: Action): Actor {
  // Anon-permitted actions short-circuit before the auth check.
  if (isAnonymous(actor) && !can(actor, action)) {
    throw new AuthenticationError()
  }
  if (!can(actor, action)) {
    throw new AuthorizationError(`forbidden: ${action}`, action)
  }
  return actor
}

export function requireStaff(actor: Actor, atLeastRole?: StaffRole): StaffActor {
  if (isAnonymous(actor)) throw new AuthenticationError()
  if (!isStaff(actor)) throw new AuthorizationError('staff role required')
  if (atLeastRole && !hasAtLeastRole(actor.role, atLeastRole)) {
    throw new AuthorizationError(`role ${atLeastRole} or higher required`)
  }
  return actor
}
