import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getAppOrigin } from '@shared/infra/auth/get-app-origin'
import { isProtectedRoute } from '@shared/infra/auth/route-gating'
import { isStaffRole, normalizeOrgRole } from '@shared/infra/auth/roles'

/**
 * Edge middleware. Per ADR 004 + PRD 04:
 *
 * - Public routes (marketing, /sign-in, /sign-up, /api/health,
 *   /api/inngest, /api/webhooks/*) require no auth.
 * - Protected routes (/app/**, /ops/**, certain /api/**) require an
 *   authenticated Clerk session — unauth users are redirected to
 *   /sign-in with a returnBackUrl.
 * - /ops/** ALSO requires the user to be a member of the staff
 *   organization with one of our recognized roles. Per-action role
 *   enforcement (analyst-can-extract, validator-can-signoff) lives
 *   in the contexts via can() — middleware only enforces "have a
 *   recognized staff role to enter the building."
 */

const isProtected = createRouteMatcher((req) => isProtectedRoute(req.nextUrl.pathname))
const isOpsRoute = createRouteMatcher(['/ops', '/ops/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return NextResponse.next()
  const session = await auth()
  if (!session.userId) {
    // Build the return URL from the canonical public origin, not
    // `req.url` — behind Railway's proxy the latter is the internal
    // Node hostname. See get-app-origin.ts for the full story.
    const backUrl = `${getAppOrigin()}${req.nextUrl.pathname}${req.nextUrl.search}`
    return session.redirectToSignIn({ returnBackUrl: backUrl })
  }
  if (isOpsRoute(req)) {
    // Read from auth().orgRole rather than sessionClaims.org_role so we
    // work across both v1 and v2 Clerk session tokens (v2 nests org
    // claims under `o.rol` and omits the `org:` prefix). normalizeOrgRole
    // still strips the prefix that v1 tokens carry.
    const role = normalizeOrgRole(session.orgRole)
    if (!isStaffRole(role)) {
      // Authed but not staff — bounce to /app (their customer surface).
      const url = new URL('/app', req.url)
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
})

export const config = {
  // Run on every route except Next internals + static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
