import { defineConfig } from 'drizzle-kit'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const url = process.env.DATABASE_URL ?? ''

export default defineConfig({
  schema: './src/shared/infra/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
  // Per-worker schema strategy for test isolation: tests prefix table
  // names with `pg_temp_<workerId>` via a runtime tablesFilter wrapper
  // (see src/shared/infra/db/test-isolation.ts when added in task #6).
})
