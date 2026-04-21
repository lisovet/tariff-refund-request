import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'

/**
 * Drizzle Postgres client. Reads DATABASE_URL from env (required).
 *
 * Per ADR 003: Postgres is the system of record. Railway for dev /
 * staging / production (one project, three environments). The
 * postgres-js driver works against any standard Postgres, so a
 * future swap to RDS or Supabase is a one-line env change.
 *
 * TODO(human-action): provision the Railway Postgres service and
 * set DATABASE_URL in the platform environment. Per-environment
 * setup documented in `drizzle/README.md`.
 */

let cached: ReturnType<typeof drizzle<typeof schema>> | undefined

export function createDbClient(): ReturnType<typeof drizzle<typeof schema>> {
  if (cached !== undefined) return cached
  const url = process.env.DATABASE_URL
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error(
      'DATABASE_URL is not set. Configure it in .env.local (Railway Postgres connection string).',
    )
  }
  const sql = postgres(url, { prepare: false })
  cached = drizzle(sql, { schema })
  return cached
}

/** Reset the cached client. Used by integration tests between workers. */
export function resetDbClient(): void {
  cached = undefined
}
