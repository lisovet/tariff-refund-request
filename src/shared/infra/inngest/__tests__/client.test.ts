import { describe, expect, it } from 'vitest'
import { inngest } from '../client'
import { workflows } from '../workflows'

/**
 * Inngest client wiring for task #4. Real "fires + completes" verification
 * needs the dev server (`npx inngest-cli@latest dev`); the unit tests
 * here verify the client is constructed correctly and the registered
 * workflow surface is what downstream tasks expect.
 */

describe('inngest client', () => {
  it('exposes a configured client with the platform id', () => {
    expect(inngest).toBeDefined()
    expect(inngest.id).toBe('tariff-refund-platform')
  })
})

describe('inngest workflows registry', () => {
  it('exposes a workflows array (additive — downstream tasks append)', () => {
    expect(Array.isArray(workflows)).toBe(true)
  })

  it('contains the smoke workflow used by the dev-server health check', () => {
    const smoke = workflows.find((fn) => fn.id() === 'smoke-hello-world')
    expect(smoke).toBeDefined()
  })
})
