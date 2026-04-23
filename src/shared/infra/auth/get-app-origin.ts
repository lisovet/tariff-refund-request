/**
 * Public-origin resolver for anywhere that needs to build an absolute
 * URL pointing back at the app — most importantly the Clerk sign-in
 * `returnBackUrl`.
 *
 * Behind Railway's proxy, `req.url` and `req.nextUrl.origin` both
 * resolve to the internal Node hostname (e.g. `http://localhost:8080`).
 * Clerk copies whatever we hand it verbatim into its `redirect_url`
 * query param, so using `req.url` sends every authenticated user to a
 * URL that doesn't exist in their browser.
 *
 * The fix is to pass an explicit canonical origin via
 * `NEXT_PUBLIC_APP_URL`. `NEXT_PUBLIC_*` is inlined by Next at build
 * time, so edge middleware can read it without pulling in a Node-only
 * config module.
 */

export function getAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL
  if (!raw) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL is not set. Define it in .env.local for dev and as a Railway env var for deploys (e.g. https://tariffrefundrequest.com).',
    )
  }
  return raw.replace(/\/+$/, '')
}
