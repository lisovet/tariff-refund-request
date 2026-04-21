import { beforeEach, describe, expect, it } from 'vitest'
import { createInMemoryBillingRepo } from '../in-memory-repo'

describe('InMemoryBillingRepo — Stripe event dedupe', () => {
  let repo: ReturnType<typeof createInMemoryBillingRepo>
  beforeEach(() => {
    repo = createInMemoryBillingRepo()
  })

  it('markEventProcessed succeeds the first time', async () => {
    const result = await repo.markEventProcessed({
      eventId: 'evt_x',
      eventType: 'checkout.session.completed',
    })
    expect(result.firstSeen).toBe(true)
  })

  it('markEventProcessed reports duplicate on the second call', async () => {
    await repo.markEventProcessed({
      eventId: 'evt_x',
      eventType: 'checkout.session.completed',
    })
    const second = await repo.markEventProcessed({
      eventId: 'evt_x',
      eventType: 'checkout.session.completed',
    })
    expect(second.firstSeen).toBe(false)
  })

  it('treats distinct event ids independently', async () => {
    const a = await repo.markEventProcessed({
      eventId: 'evt_a',
      eventType: 'checkout.session.completed',
    })
    const b = await repo.markEventProcessed({
      eventId: 'evt_b',
      eventType: 'checkout.session.completed',
    })
    expect(a.firstSeen).toBe(true)
    expect(b.firstSeen).toBe(true)
  })
})
