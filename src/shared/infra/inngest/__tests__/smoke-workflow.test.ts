import { describe, expect, it } from 'vitest'
import { smokeHelloWorldHandler } from '../workflows/smoke-hello-world'

/**
 * Workflow logic test. The handler is plain async; the Inngest wrapper
 * is exercised by the dev-server health check, not by unit tests.
 */

describe('smoke-hello-world handler', () => {
  it('returns a greeting payload referencing the event id', async () => {
    const calls: Array<[string, () => unknown]> = []
    const step = {
      async run<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        calls.push([name, fn])
        return await fn()
      },
    }
    const event = { id: 'evt_test_001', data: { who: 'world' } }

    const result = await smokeHelloWorldHandler({ event, step })

    expect(result).toEqual({
      greeting: 'hello, world',
      observedEventId: 'evt_test_001',
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.[0]).toBe('compose-greeting')
  })
})
