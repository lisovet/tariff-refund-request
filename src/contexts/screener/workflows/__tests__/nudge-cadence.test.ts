import { describe, expect, it, vi } from 'vitest'
import { nudgeCadenceHandler } from '../nudge-cadence'
import { createConsoleTransport } from '@shared/infra/email/console-transport'

const baseEvent = {
  id: 'evt_screener_completed',
  data: {
    sessionId: 'sess_x',
    email: 'a@b.co',
    company: 'Acme',
    magicLink: 'https://app.example.test/screener/results?token=t',
  },
}

interface StepStub {
  readonly sleepCalls: Array<{ id: string; ms: number }>
  readonly runCalls: string[]
  readonly waitCalls: Array<{ id: string; event: string; timeout: string }>
  readonly purchaseAt?: '24h' | '72h' | 'none'
}

function makeStep(opts: { purchaseAt?: '24h' | '72h' | 'none' } = {}): StepStub & {
  readonly api: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
    sleep(id: string, ms: number): Promise<void>
    waitForEvent<T>(
      id: string,
      args: { event: string; timeout: string; if?: string },
    ): Promise<T | null>
  }
} {
  const stub: StepStub = {
    sleepCalls: [],
    runCalls: [],
    waitCalls: [],
    purchaseAt: opts.purchaseAt ?? 'none',
  }
  return {
    ...stub,
    api: {
      async run<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        stub.runCalls.push(name)
        return await fn()
      },
      async sleep(id: string, ms: number) {
        stub.sleepCalls.push({ id, ms })
      },
      async waitForEvent<T>(
        id: string,
        args: { event: string; timeout: string; if?: string },
      ): Promise<T | null> {
        stub.waitCalls.push({ id, event: args.event, timeout: args.timeout })
        // Simulate the purchase arriving within this window iff the
        // caller asked for it AND the wait id matches.
        if (
          (stub.purchaseAt === '24h' && id.includes('24h')) ||
          (stub.purchaseAt === '72h' && id.includes('72h'))
        ) {
          return { id: 'evt_payment', data: { sessionId: 'sess_x' } } as T
        }
        return null
      },
    },
  }
}

describe('nudge-cadence — no purchase, both nudges fire', () => {
  it('waits 24h, sends nudge 1; waits 48h more, sends nudge 2', async () => {
    const transport = createConsoleTransport()
    const sendSpy = vi.spyOn(transport, 'send')
    const stub = makeStep({ purchaseAt: 'none' })

    const result = await nudgeCadenceHandler(
      { event: baseEvent, step: stub.api },
      { email: transport, fromAddress: 'noreply@example.test' },
    )

    expect(stub.waitCalls).toHaveLength(2)
    expect(stub.waitCalls[0]?.timeout).toBe('24h')
    expect(stub.waitCalls[1]?.timeout).toBe('48h')
    expect(sendSpy).toHaveBeenCalledTimes(2)
    expect(result.delivered).toEqual(['nudge-24h', 'nudge-72h'])
    expect(result.cancelledBy).toBeNull()
  })
})

describe('nudge-cadence — purchase in first window cancels', () => {
  it('skips both nudges if purchase event arrives in the 24h window', async () => {
    const transport = createConsoleTransport()
    const sendSpy = vi.spyOn(transport, 'send')
    const stub = makeStep({ purchaseAt: '24h' })

    const result = await nudgeCadenceHandler(
      { event: baseEvent, step: stub.api },
      { email: transport, fromAddress: 'noreply@example.test' },
    )

    expect(sendSpy).not.toHaveBeenCalled()
    expect(result.delivered).toEqual([])
    expect(result.cancelledBy).toBe('purchase-during-24h-window')
  })
})

describe('nudge-cadence — purchase in second window cancels nudge 2', () => {
  it('sends nudge 1 but skips nudge 2 when purchase arrives in the 72h window', async () => {
    const transport = createConsoleTransport()
    const sendSpy = vi.spyOn(transport, 'send')
    const stub = makeStep({ purchaseAt: '72h' })

    const result = await nudgeCadenceHandler(
      { event: baseEvent, step: stub.api },
      { email: transport, fromAddress: 'noreply@example.test' },
    )

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(result.delivered).toEqual(['nudge-24h'])
    expect(result.cancelledBy).toBe('purchase-during-72h-window')
  })
})

describe('nudge-cadence — idempotency keys per cadence step', () => {
  it('uses distinct idempotencyKeys so retries do not double-send', async () => {
    const transport = createConsoleTransport()
    const sendSpy = vi.spyOn(transport, 'send')
    const stub = makeStep({ purchaseAt: 'none' })

    await nudgeCadenceHandler(
      { event: baseEvent, step: stub.api },
      { email: transport, fromAddress: 'noreply@example.test' },
    )

    const keys = sendSpy.mock.calls.map((c) => c[0]?.idempotencyKey)
    expect(keys).toEqual([
      'screener-nudge-24h:sess_x',
      'screener-nudge-72h:sess_x',
    ])
  })
})
