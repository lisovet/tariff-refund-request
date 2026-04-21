import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleStripeEvent } from '../event-handler'
import type { PaymentCompletedPayload } from '../event-handler'
import { createInMemoryBillingRepo } from '../in-memory-repo'

const makePublish = () =>
  vi.fn<(payload: PaymentCompletedPayload) => Promise<void>>(async () => {})

const checkoutCompleted = (id = 'evt_001') =>
  ({
    id,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_001',
        payment_intent: 'pi_test_001',
        amount_total: 9900, // $99.00 in cents
        customer_email: 'a@b.co',
        metadata: {
          screenerSessionId: 'sess_x',
          sku: 'recovery_kit',
        },
      },
    },
  }) as unknown as Parameters<typeof handleStripeEvent>[0]['event']

describe('handleStripeEvent — idempotency', () => {
  let repo: ReturnType<typeof createInMemoryBillingRepo>
  let publish: ReturnType<typeof makePublish>
  beforeEach(() => {
    repo = createInMemoryBillingRepo()
    publish = makePublish()
  })

  it('processes a fresh event and publishes platform/payment.completed', async () => {
    const result = await handleStripeEvent(
      { event: checkoutCompleted() },
      { repo, publishPaymentCompleted: publish },
    )
    expect(result.status).toBe('processed')
    expect(publish).toHaveBeenCalledTimes(1)
    expect(publish).toHaveBeenCalledWith({
      sessionId: 'sess_x',
      sku: 'recovery_kit',
      stripeChargeId: 'pi_test_001',
      amountUsdCents: 9900,
      email: 'a@b.co',
    })
  })

  it('REPLAY: a second invocation with the same event id is detected as duplicate', async () => {
    await handleStripeEvent(
      { event: checkoutCompleted() },
      { repo, publishPaymentCompleted: publish },
    )
    const second = await handleStripeEvent(
      { event: checkoutCompleted() },
      { repo, publishPaymentCompleted: publish },
    )
    expect(second.status).toBe('duplicate')
    // Critically: publish must NOT have fired again.
    expect(publish).toHaveBeenCalledTimes(1)
  })

  it('processes distinct event ids independently', async () => {
    await handleStripeEvent(
      { event: checkoutCompleted('evt_001') },
      { repo, publishPaymentCompleted: publish },
    )
    await handleStripeEvent(
      { event: checkoutCompleted('evt_002') },
      { repo, publishPaymentCompleted: publish },
    )
    expect(publish).toHaveBeenCalledTimes(2)
  })
})

describe('handleStripeEvent — unknown event types', () => {
  it('marks the event processed but does not publish (silent no-op for unmodeled types)', async () => {
    const repo = createInMemoryBillingRepo()
    const publish = makePublish()
    const result = await handleStripeEvent(
      {
        event: {
          id: 'evt_other',
          type: 'invoice.created',
          data: { object: {} },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      { repo, publishPaymentCompleted: publish },
    )
    expect(result.status).toBe('processed')
    expect(publish).not.toHaveBeenCalled()
  })
})

describe('handleStripeEvent — checkout.session.completed validation', () => {
  it('throws if metadata.screenerSessionId is missing', async () => {
    const repo = createInMemoryBillingRepo()
    const publish = makePublish()
    const event = checkoutCompleted()
    // Strip the screenerSessionId.
    ;(event as { data: { object: { metadata: Record<string, string> } } })
      .data.object.metadata = { sku: 'recovery_kit' }
    await expect(
      handleStripeEvent(
        { event },
        { repo, publishPaymentCompleted: publish },
      ),
    ).rejects.toThrow(/screenerSessionId/)
  })
})
