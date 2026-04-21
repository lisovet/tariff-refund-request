import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('email transport factory', () => {
  const snapshot = { ...process.env }

  beforeEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
  })
  afterEach(() => {
    process.env = { ...snapshot }
  })

  it('returns the console transport when RESEND_API_KEY is missing', async () => {
    const { getEmailTransport, resetEmailTransport } = await import('../index')
    resetEmailTransport()
    expect(getEmailTransport().isActive()).toBe(false)
  })

  it('returns the Resend transport when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test'
    process.env.EMAIL_FROM = 'noreply@example.test'
    const { getEmailTransport, resetEmailTransport } = await import('../index')
    resetEmailTransport()
    expect(getEmailTransport().isActive()).toBe(true)
  })

  it('throws if Resend selected but EMAIL_FROM is missing', async () => {
    process.env.RESEND_API_KEY = 're_test'
    const { getEmailTransport, resetEmailTransport } = await import('../index')
    resetEmailTransport()
    expect(() => getEmailTransport()).toThrow(/EMAIL_FROM/)
  })
})
