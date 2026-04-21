import { describe, expect, it } from 'vitest'
import { createNoopErrorTracker, createNoopLogger } from '../noop'

/**
 * No-op transports — used when SENTRY_DSN / AXIOM_TOKEN are missing.
 * Per .ralph/PROMPT.md: observability MUST not block the rest of the
 * platform when keys are absent. The no-op implementations satisfy
 * the interface and silently swallow events.
 */

describe('noop logger', () => {
  it('accepts every level without throwing', async () => {
    const log = createNoopLogger()
    expect(() => log.info('msg', { a: 1 })).not.toThrow()
    expect(() => log.warn('msg', { b: 2 })).not.toThrow()
    expect(() => log.error('msg', { c: 3 })).not.toThrow()
    await expect(log.flush()).resolves.toBeUndefined()
  })

  it('reports as inactive', () => {
    const log = createNoopLogger()
    expect(log.isActive()).toBe(false)
  })
})

describe('noop error tracker', () => {
  it('accepts captures + breadcrumbs without throwing', () => {
    const t = createNoopErrorTracker()
    expect(() => t.captureException(new Error('x'))).not.toThrow()
    expect(() => t.captureMessage('hello')).not.toThrow()
    expect(() => t.addBreadcrumb({ category: 'test', message: 'crumb' })).not.toThrow()
  })

  it('reports as inactive', () => {
    const t = createNoopErrorTracker()
    expect(t.isActive()).toBe(false)
  })
})
