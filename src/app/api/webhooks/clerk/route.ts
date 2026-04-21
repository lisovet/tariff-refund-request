import { Webhook } from 'svix'
import { handleClerkEvent, getIdentityRepo, type ClerkWebhookEvent } from '@contexts/identity'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * Clerk webhook receiver. Verifies the Svix signature, parses the
 * event, hands off to handleClerkEvent. Idempotent at the repo
 * layer (clerkUserId UNIQUE constraint), so Svix retries are safe.
 *
 * Per ADR 004 + .ralph/PROMPT.md: missing CLERK_WEBHOOK_SECRET makes
 * the route a no-op success in dev — the real signature check is gated
 * on the secret being configured. This keeps `npm run dev` runnable
 * without Clerk live keys; production verification happens once the
 * secret is set in the env.
 */

export async function POST(req: Request): Promise<Response> {
  const log = getLogger()
  const tracker = getErrorTracker()

  const secret = process.env.CLERK_WEBHOOK_SECRET
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('missing svix headers', { status: 400 })
  }

  const body = await req.text()

  let event: ClerkWebhookEvent
  if (secret) {
    try {
      const wh = new Webhook(secret)
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent
    } catch (err) {
      log.warn('clerk webhook signature verification failed', { svixId })
      tracker.captureException(err, { svixId, route: '/api/webhooks/clerk' })
      return new Response('signature mismatch', { status: 401 })
    }
  } else {
    // No secret configured (dev). Trust the body shape — but do not
    // apply changes in production environments.
    if (process.env.NODE_ENV === 'production') {
      return new Response('webhook secret not configured', { status: 500 })
    }
    event = JSON.parse(body) as ClerkWebhookEvent
  }

  try {
    await handleClerkEvent(event, { repo: getIdentityRepo() })
    log.info('clerk webhook handled', { type: event.type, svixId })
    return Response.json({ ok: true })
  } catch (err) {
    log.error('clerk webhook handler failed', {
      type: event.type,
      svixId,
      error: String(err),
    })
    tracker.captureException(err, { type: event.type, svixId })
    return new Response('handler error', { status: 500 })
  }
}
