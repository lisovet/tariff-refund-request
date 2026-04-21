import { customers, staffUsers } from './schema/identity'

/**
 * Drizzle schema registry. Downstream tasks register tables here as they
 * land (cases + audit_log in task #39, documents + recovery_sources in
 * task #44, entries in task #55, etc.).
 *
 * Per ADR 003, this module is the single source of schema truth for the
 * platform. drizzle-kit reads from here to generate migrations.
 */

export const schema = {
  tables: {
    customers,
    staffUsers,
  },
} as const

export type Schema = typeof schema

// Re-export tables for direct use by drizzle queries.
export { customers, staffUsers }
export type { CustomerRow, StaffUserRow } from './schema/identity'
