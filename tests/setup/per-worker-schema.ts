import { afterAll, beforeAll } from 'vitest'
import {
  applyTestIsolation,
  dropTestIsolation,
} from '@/shared/infra/db/test-isolation'

/**
 * Vitest setup: each worker gets its own Postgres schema (per ADR 003).
 * No-op when DATABASE_URL is missing — unit tests run normally; only
 * integration tests that touch the real DB rely on the isolation.
 *
 * This file is referenced by vitest.config.ts → test.setupFiles.
 */

let isolatedSchema: string | undefined

beforeAll(async () => {
  const result = await applyTestIsolation()
  if (result.active) {
    isolatedSchema = result.schema
  }
})

afterAll(async () => {
  if (isolatedSchema) {
    await dropTestIsolation(isolatedSchema)
    isolatedSchema = undefined
  }
})
