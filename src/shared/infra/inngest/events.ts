import { eventType, staticSchema } from 'inngest'

/**
 * Typed event catalog. Per ADR 007, events are typed end-to-end so
 * publishers and workflow consumers cannot drift.
 *
 * `staticSchema<T>()` provides TypeScript types without runtime
 * validation — boundaries already validate via Zod (per ADR 009),
 * so the runtime check would be redundant.
 */

export const platformSmokeHello = eventType('platform/smoke.hello', {
  schema: staticSchema<{ data: { who: string } }>(),
})

export const caseStateTransitioned = eventType('platform/case.state.transitioned', {
  schema: staticSchema<{
    data: {
      caseId: string
      from: string
      to: string
      actorId: string
    }
  }>(),
})
