import { auth, currentUser } from '@clerk/nextjs/server'
import { type Actor, AnonymousActor } from './actor'
import { isStaffRole, normalizeOrgRole } from './roles'

/**
 * Clerk session → typed Actor.
 *
 * Per ADR 001: the platform never imports Clerk types into context
 * code. The resolver is the single seam — it converts whatever Clerk
 * returns into our `Actor`, and contexts only see `Actor`.
 *
 * Two layers:
 *   - resolveActorFromSession(shape) — pure function, fully testable.
 *   - resolveCurrentActor() — calls Clerk's auth() + currentUser() in
 *     a Next route-handler / RSC context, then delegates to the pure
 *     function above.
 *
 * The local customers.id / staff_users.id lookup lands in task #11
 * (the resolver here surfaces clerkUserId as `actor.id` until then).
 */

export interface ClerkSessionShape {
  readonly userId: string | null
  readonly email: string | null
  readonly fullName?: string | null
  // Top-level orgRole from auth() — stable across v1 and v2 Clerk
  // session tokens. sessionClaims stays around for any custom claims
  // we read directly, but role resolution reads from here.
  readonly orgRole?: string | null
  readonly sessionClaims: {
    readonly org_role?: string | null
    readonly org_name?: string | null
  } & Readonly<Record<string, unknown>>
}

export function resolveActorFromSession(session: ClerkSessionShape): Actor {
  if (!session.userId) return AnonymousActor

  const orgRole = normalizeOrgRole(session.orgRole)
  if (orgRole && isStaffRole(orgRole)) {
    return {
      kind: 'staff',
      id: session.userId,
      clerkUserId: session.userId,
      role: orgRole,
      name: session.fullName ?? 'Unknown',
    }
  }

  if (!session.email) {
    throw new Error('cannot resolve customer actor without an email address')
  }

  return {
    kind: 'customer',
    id: session.userId,
    clerkUserId: session.userId,
    email: session.email,
  }
}

export async function resolveCurrentActor(): Promise<Actor> {
  const session = await auth()
  if (!session.userId) return AnonymousActor

  // currentUser() is a separate Clerk call — only invoke if we have a user.
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null
  const fullName = user?.fullName ?? null

  return resolveActorFromSession({
    userId: session.userId,
    email,
    fullName,
    orgRole: session.orgRole ?? null,
    sessionClaims: (session.sessionClaims ?? {}) as ClerkSessionShape['sessionClaims'],
  })
}
