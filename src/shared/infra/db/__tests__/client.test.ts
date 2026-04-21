import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * Client-layer smoke tests for task #2.
 *
 * The client never makes a network call during tests — it only constructs
 * a Drizzle handle from a connection string. Tests verify env validation
 * and that a missing DATABASE_URL fails fast with a clear message.
 */

describe('db client', () => {
  const originalEnv = process.env.DATABASE_URL

  beforeEach(() => {
    delete process.env.DATABASE_URL
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalEnv
    }
  })

  it('throws a clear error when DATABASE_URL is missing', async () => {
    const { createDbClient } = await import('../client')
    expect(() => createDbClient()).toThrow(/DATABASE_URL/)
  })

  it('returns a drizzle handle when DATABASE_URL is present', async () => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
    const { createDbClient } = await import('../client')
    const db = createDbClient()
    expect(db).toBeDefined()
    expect(db).toHaveProperty('select')
    expect(db).toHaveProperty('insert')
  })
})
