import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isProtectedRoute } from '@shared/infra/auth/route-gating'

/**
 * Edge middleware. Per ADR 004 + PRD 04:
 *
 * - Public routes (marketing, /sign-in, /sign-up, /api/health,
 *   /api/inngest, /api/webhooks/*) require no auth.
 * - Protected routes (/app/**, /ops/**, certain /api/**) require an
 *   authenticated Clerk session — unauth users are redirected to
 *   /sign-in with a returnUrl.
 *
 * Role gating (analyst | validator | coordinator | admin for /ops)
 * happens inside the contexts via the Actor resolver (task #10), not
 * here. This middleware only enforces "any authed user reaches /app
 * and /ops"; the context layer decides what they may *do*.
 */

const isProtected = createRouteMatcher((req) => isProtectedRoute(req.nextUrl.pathname))

export default clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return NextResponse.next()
  const { userId, redirectToSignIn } = await auth()
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }
  return NextResponse.next()
})

export const config = {
  // Run on every route except Next internals + static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
