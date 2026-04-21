import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * Factory: picks the right transport based on env. The platform code
 * imports `getLogger()` / `getErrorTracker()` and never branches on env
 * itself; the factory handles the no-op fallback.
 */

describe('observability factory', () => {
  const snapshot = { ...process.env }

  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('SENTRY_') || key.startsWith('AXIOM_')) {
        delete process.env[key]
      }
    }
  })

  afterEach(() => {
    process.env = { ...snapshot }
  })

  it('returns inactive (no-op) logger when AXIOM env is missing', async () => {
    const { getLogger, resetObservability } = await import('../index')
    resetObservability()
    expect(getLogger().isActive()).toBe(false)
  })

  it('returns active logger when AXIOM env is configured', async () => {
    process.env.AXIOM_TOKEN = 'tok'
    process.env.AXIOM_DATASET = 'ds'
    const { getLogger, resetObservability } = await import('../index')
    resetObservability()
    expect(getLogger().isActive()).toBe(true)
  })

  it('returns inactive (no-op) error tracker when SENTRY_DSN is missing', async () => {
    const { getErrorTracker, resetObservability } = await import('../index')
    resetObservability()
    expect(getErrorTracker().isActive()).toBe(false)
  })

  it('caches transports across calls until reset', async () => {
    const { getLogger, resetObservability } = await import('../index')
    resetObservability()
    const a = getLogger()
    const b = getLogger()
    expect(a).toBe(b)
    resetObservability()
    expect(getLogger()).not.toBe(a)
  })
})
