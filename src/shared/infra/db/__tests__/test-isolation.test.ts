import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { workerSchemaName, applyTestIsolation } from '../test-isolation'

/**
 * Per-worker schema isolation for parallel-safe integration tests.
 *
 * Per ADR 003: each Vitest worker writes to its own schema
 * (`tr_test_<workerId>`) so parallel runs don't collide. The strategy:
 * 1. Each worker resolves its schema name from VITEST_POOL_ID.
 * 2. The schema is created fresh and dropped on teardown.
 * 3. Drizzle's search_path is set to the per-worker schema.
 */

describe('workerSchemaName', () => {
  it('builds a schema name from a worker id', () => {
    expect(workerSchemaName('1')).toBe('tr_test_1')
    expect(workerSchemaName('42')).toBe('tr_test_42')
  })

  it('rejects non-alphanumeric worker ids (sql-safety)', () => {
    expect(() => workerSchemaName('1; DROP')).toThrow(/invalid/i)
    expect(() => workerSchemaName('')).toThrow(/empty/i)
    expect(() => workerSchemaName('a-b')).toThrow(/invalid/i)
  })
})

describe('applyTestIsolation', () => {
  const snapshot = { ...process.env }

  beforeEach(() => {
    delete process.env.DATABASE_URL
    delete process.env.VITEST_POOL_ID
  })

  afterEach(() => {
    process.env = { ...snapshot }
  })

  it('returns inactive when DATABASE_URL is missing', async () => {
    const result = await applyTestIsolation()
    expect(result.active).toBe(false)
    expect(result.schema).toBeUndefined()
  })

  it('returns active with a worker schema when env is set', async () => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
    process.env.VITEST_POOL_ID = '7'
    const result = await applyTestIsolation({ skipApply: true })
    expect(result.active).toBe(true)
    expect(result.schema).toBe('tr_test_7')
  })

  it('falls back to worker id "1" when VITEST_POOL_ID is missing', async () => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
    const result = await applyTestIsolation({ skipApply: true })
    expect(result.schema).toBe('tr_test_1')
  })
})
