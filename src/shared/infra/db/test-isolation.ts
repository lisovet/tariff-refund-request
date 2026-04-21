import postgres from 'postgres'

/**
 * Per-worker schema isolation for parallel-safe integration tests.
 *
 * Per ADR 003: each Vitest worker writes to its own schema
 * (`tr_test_<workerId>`) so parallel runs don't collide. Vitest sets
 * `VITEST_POOL_ID` per worker; we use it to derive the schema name.
 *
 * Wired into vitest.config.ts via the `setupFiles` hook (added in
 * task #6's vitest config update). When `DATABASE_URL` is missing,
 * the helper is a no-op and integration tests targeting the real DB
 * are skipped.
 */

const SCHEMA_PREFIX = 'tr_test_'

export function workerSchemaName(workerId: string): string {
  if (workerId.length === 0) throw new Error('worker id is empty')
  if (!/^[A-Za-z0-9]+$/.test(workerId)) {
    throw new Error(`invalid worker id: ${workerId}`)
  }
  return `${SCHEMA_PREFIX}${workerId}`
}

export interface IsolationResult {
  readonly active: boolean
  readonly schema?: string
}

export interface ApplyTestIsolationOptions {
  /** Skip the actual schema CREATE/DROP (used by unit tests). */
  readonly skipApply?: boolean
}

export async function applyTestIsolation(
  opts: ApplyTestIsolationOptions = {},
): Promise<IsolationResult> {
  const url = process.env.DATABASE_URL
  if (typeof url !== 'string' || url.length === 0) {
    return { active: false }
  }
  const workerId = process.env.VITEST_POOL_ID ?? '1'
  const schema = workerSchemaName(workerId)

  if (opts.skipApply) {
    return { active: true, schema }
  }

  // Establish the worker schema, set search_path so all queries land there.
  const sql = postgres(url, { prepare: false })
  try {
    await sql.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await sql.unsafe(`CREATE SCHEMA ${schema}`)
    await sql.unsafe(`SET search_path TO ${schema}`)
  } finally {
    await sql.end({ timeout: 1 })
  }

  return { active: true, schema }
}

export async function dropTestIsolation(schema: string): Promise<void> {
  const url = process.env.DATABASE_URL
  if (typeof url !== 'string' || url.length === 0) return
  const sql = postgres(url, { prepare: false })
  try {
    await sql.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
  } finally {
    await sql.end({ timeout: 1 })
  }
}
