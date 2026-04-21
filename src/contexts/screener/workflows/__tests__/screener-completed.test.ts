import { describe, expect, it, vi } from 'vitest'
import { screenerCompletedHandler } from '../screener-completed'
import { createConsoleTransport } from '@shared/infra/email/console-transport'

describe('screener-completed workflow handler', () => {
  it('sends the results email with the magic-link, returns delivery id', async () => {
    const transport = createConsoleTransport()
    const sendSpy = vi.spyOn(transport, 'send')

    const calls: Array<[string, () => unknown]> = []
    const step = {
      async run<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        calls.push([name, fn])
        return await fn()
      },
    }

    const event = {
      id: 'evt_test_001',
      data: {
        sessionId: 'sess_x',
        email: 'a@b.co',
        company: 'Acme',
        magicLink: 'https://app.example.test/screener/results?token=t',
      },
    }

    const result = await screenerCompletedHandler({ event, step }, {
      email: transport,
      fromAddress: 'noreply@example.test',
    })

    expect(sendSpy).toHaveBeenCalledTimes(1)
    const sent = sendSpy.mock.calls[0]?.[0]
    expect(sent?.to).toBe('a@b.co')
    expect(sent?.subject).toMatch(/screener results/i)
    expect(sent?.idempotencyKey).toBe('screener-results:sess_x')
    expect(sent?.html).toContain('https://app.example.test/screener/results?token=t')

    expect(result.delivered).toBe(true)
    expect(result.messageId).toMatch(/^console_/)
    expect(calls.length).toBeGreaterThanOrEqual(1)
  })

  it('handles missing company gracefully (renders generic salutation)', async () => {
    const transport = createConsoleTransport()
    const sendSpy = vi.spyOn(transport, 'send')

    await screenerCompletedHandler(
      {
        event: {
          id: 'evt_x',
          data: {
            sessionId: 'sess_y',
            email: 'a@b.co',
            company: null,
            magicLink: 'https://app.example.test/screener/results?token=t',
          },
        },
        step: {
          async run<T>(_name: string, fn: () => T | Promise<T>): Promise<T> {
            return await fn()
          },
        },
      },
      { email: transport, fromAddress: 'noreply@example.test' },
    )

    expect(sendSpy).toHaveBeenCalled()
    const sent = sendSpy.mock.calls[0]?.[0]
    expect(sent?.html).toMatch(/Your screener results/i)
  })
})
