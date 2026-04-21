import { describe, expect, it } from 'vitest'
import { isProtectedRoute, isPublicRoute, AUTH_ROUTES } from '../route-gating'

/**
 * Route-gating predicates. The middleware (src/middleware.ts) uses
 * these to decide whether to require auth on a request. Per ADR 004:
 *
 * - Marketing surfaces, /api/health, /api/inngest, /api/webhooks/*,
 *   and the Clerk sign-in / sign-up pages are public.
 * - Everything under /app and /ops requires auth (and additionally a
 *   staff role for /ops, enforced at the context layer in task #10).
 *
 * Predicates are pure so we can unit-test them without touching the
 * middleware runtime.
 */

describe('isPublicRoute', () => {
  it.each([
    '/',
    '/how-it-works',
    '/pricing',
    '/trust',
    '/trust/sub-processors',
    '/api/health',
    '/api/inngest',
    '/api/webhooks/clerk',
    '/api/webhooks/stripe',
    AUTH_ROUTES.signIn,
    AUTH_ROUTES.signUp,
    `${AUTH_ROUTES.signIn}/factor-one`,
  ])('treats %s as public', (path) => {
    expect(isPublicRoute(path)).toBe(true)
  })

  it.each(['/app', '/app/dashboard', '/ops', '/ops/queues', '/api/cases'])(
    'treats %s as not public',
    (path) => {
      expect(isPublicRoute(path)).toBe(false)
    },
  )
})

describe('isProtectedRoute', () => {
  it.each(['/app', '/app/dashboard', '/ops', '/ops/queues', '/api/cases'])(
    'treats %s as protected',
    (path) => {
      expect(isProtectedRoute(path)).toBe(true)
    },
  )

  it.each(['/', '/pricing', AUTH_ROUTES.signIn, '/api/health'])(
    'treats %s as not protected',
    (path) => {
      expect(isProtectedRoute(path)).toBe(false)
    },
  )
})
