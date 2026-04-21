import { Inngest } from 'inngest'

/**
 * Inngest client. One per app — the `id` binds the platform's events
 * and functions in the Inngest dev server / cloud dashboard. Keep it
 * stable; Inngest uses it for cross-environment event addressing.
 *
 * Per ADR 007: workflows are durable, replayable, observable. Events
 * are typed via `eventType` + `staticSchema` in `./events.ts`.
 *
 * TODO(human-action): set INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY in
 * production (cloud); local dev uses the dev server with no keys.
 */

export const inngest = new Inngest({
  id: 'tariff-refund-platform',
})
