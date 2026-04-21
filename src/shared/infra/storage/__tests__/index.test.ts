import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * Storage factory: picks the right adapter based on env.
 *
 * - STORAGE_DRIVER=s3  → S3/R2/MinIO adapter (requires R2_* env vars)
 * - STORAGE_DRIVER=memory  → in-memory adapter (default for tests/dev)
 */

describe('storage factory', () => {
  const snapshot = { ...process.env }

  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('R2_') || key.startsWith('STORAGE_')) delete process.env[key]
    }
  })

  afterEach(() => {
    process.env = { ...snapshot }
  })

  it('returns the memory adapter by default', async () => {
    const { createStorage } = await import('../index')
    const storage = createStorage()
    // memory adapter exposes listVersions; s3 adapter does not
    expect(storage).toHaveProperty('listVersions')
  })

  it('returns the s3 adapter when STORAGE_DRIVER=s3 and R2 env is configured', async () => {
    process.env.STORAGE_DRIVER = 's3'
    process.env.R2_ACCESS_KEY_ID = 'test'
    process.env.R2_SECRET_ACCESS_KEY = 'test'
    process.env.R2_ENDPOINT = 'https://test.r2.cloudflarestorage.com'
    process.env.R2_BUCKET = 'test-bucket'
    const { createStorage } = await import('../index')
    const storage = createStorage()
    expect(storage).not.toHaveProperty('listVersions')
  })

  it('throws when STORAGE_DRIVER=s3 but R2 env is incomplete', async () => {
    process.env.STORAGE_DRIVER = 's3'
    const { createStorage } = await import('../index')
    expect(() => createStorage()).toThrow(/R2_/)
  })
})
