import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConsoleTransport } from '../console-transport'

describe('console transport', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    logSpy.mockRestore()
  })

  it('logs the rendered email and returns a synthetic id', async () => {
    const transport = createConsoleTransport()
    const result = await transport.send({
      from: 'noreply@example.test',
      to: 'a@b.co',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
    expect(result.id).toMatch(/^console_/)
    expect(result.transport).toBe('console')
    expect(logSpy).toHaveBeenCalled()
  })

  it('reports inactive — does not actually deliver mail', () => {
    expect(createConsoleTransport().isActive()).toBe(false)
  })
})
