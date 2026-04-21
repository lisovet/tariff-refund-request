import { describe, expect, it } from 'vitest'
import { schema } from '../schema'

/**
 * Schema-layer smoke tests for task #2.
 *
 * The schema starts empty; downstream tasks register tables in dependency
 * order (cases, audit_log, customers, etc.). These tests verify the schema
 * module exports the expected shape so future migrations can append safely.
 */

describe('db schema module', () => {
  it('exports a schema object', () => {
    expect(schema).toBeDefined()
    expect(typeof schema).toBe('object')
  })

  it('exposes a tables registry the schema appends to', () => {
    expect(schema).toHaveProperty('tables')
    expect(schema.tables).toBeTypeOf('object')
  })

  it('starts with an empty tables registry awaiting downstream tasks', () => {
    expect(Object.keys(schema.tables)).toHaveLength(0)
  })
})
