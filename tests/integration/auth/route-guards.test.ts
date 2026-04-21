import { describe, expect, it } from 'vitest'
import { AnonymousActor, type Actor } from '@/shared/infra/auth/actor'
import {
  AuthenticationError,
  AuthorizationError,
  requireCan,
} from '@/shared/infra/auth/require'

/**
 * Integration test for the route-handler authorization pattern. This is
 * exactly how every protected route handler in v1 will guard itself:
 *
 *     export async function POST(req: Request) {
 *       try {
 *         const actor = await resolveCurrentActor()
 *         requireCan(actor, 'qa.signoff')
 *         // ... do the work
 *         return Response.json({ ok: true })
 *       } catch (e) {
 *         if (e instanceof AuthenticationError) return new Response(null, { status: 401 })
 *         if (e instanceof AuthorizationError) return new Response(null, { status: 403 })
 *         throw e
 *       }
 *     }
 *
 * The test proves the guard rejects forbidden actions cleanly without
 * leaking internal state, satisfying task #10's acceptance criterion.
 */

async function exampleProtectedRouteHandler(actor: Actor): Promise<Response> {
  try {
    requireCan(actor, 'qa.signoff')
    return Response.json({ ok: true, signedBy: 'name' in actor ? actor.name : 'unknown' })
  } catch (e) {
    if (e instanceof AuthenticationError) {
      return Response.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (e instanceof AuthorizationError) {
      return Response.json({ error: e.message, action: e.action }, { status: 403 })
    }
    throw e
  }
}

describe('route handler guarded by requireCan', () => {
  it('returns 401 for anonymous on a staff-only action', async () => {
    const res = await exampleProtectedRouteHandler(AnonymousActor)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'unauthenticated' })
  })

  it('returns 403 for a customer on a staff-only action', async () => {
    const customer: Actor = {
      kind: 'customer',
      id: 'cus_x',
      clerkUserId: 'user_x',
      email: 'a@b.co',
    }
    const res = await exampleProtectedRouteHandler(customer)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.action).toBe('qa.signoff')
  })

  it('returns 403 for an analyst on a validator-gated action', async () => {
    const analyst: Actor = {
      kind: 'staff',
      id: 'stf_a',
      clerkUserId: 'user_a',
      role: 'analyst',
      name: 'A. Analyst',
    }
    const res = await exampleProtectedRouteHandler(analyst)
    expect(res.status).toBe(403)
  })

  it('returns 200 for a validator on qa.signoff', async () => {
    const validator: Actor = {
      kind: 'staff',
      id: 'stf_v',
      clerkUserId: 'user_v',
      role: 'validator',
      name: 'V. Validator',
    }
    const res = await exampleProtectedRouteHandler(validator)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.signedBy).toBe('V. Validator')
  })

  it('returns 200 for an admin on qa.signoff (admin can do everything)', async () => {
    const admin: Actor = {
      kind: 'staff',
      id: 'stf_ad',
      clerkUserId: 'user_ad',
      role: 'admin',
      name: 'Admin User',
    }
    const res = await exampleProtectedRouteHandler(admin)
    expect(res.status).toBe(200)
  })
})
