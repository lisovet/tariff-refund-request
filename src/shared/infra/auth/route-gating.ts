/**
 * Pure route-gating predicates for the Clerk middleware.
 *
 * Per ADR 004 + PRD 04: marketing surfaces are public; /app and /ops
 * route groups require auth. /ops additionally requires a staff role,
 * but role enforcement happens inside contexts (per ADR 001) — the
 * middleware only enforces "any authed user can reach /ops"; whether
 * they can *do* anything there is the context layer's job.
 */

export const AUTH_ROUTES = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  afterSignIn: '/app',
  afterSignUp: '/app',
} as const

const PUBLIC_PREFIXES: readonly string[] = [
  '/sign-in',
  '/sign-up',
  '/api/health',
  '/api/inngest',
  '/api/webhooks',
]

const PUBLIC_PAGES: readonly string[] = [
  '/',
  '/how-it-works',
  '/pricing',
  '/recovery',
  '/cape-prep',
  '/concierge',
  '/for-agencies',
  '/blog',
]

const PUBLIC_PAGE_PREFIXES: readonly string[] = ['/trust', '/blog']

const PROTECTED_PREFIXES: readonly string[] = ['/app', '/ops', '/api/cases', '/api/uploads']

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PAGES.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }
  if (PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}
