import { createMemoryStorage, type MemoryStorageAdapter } from './memory'
import { createS3Storage } from './s3'
import type { StorageAdapter } from './types'

/**
 * Storage factory. Picks the adapter based on env:
 *
 *   STORAGE_DRIVER=memory  → in-memory (default — tests and local dev)
 *   STORAGE_DRIVER=s3      → S3/R2/MinIO (requires R2_* env vars)
 *
 * TODO(human-action): provision the Cloudflare R2 buckets
 * (`tariff-refund-{dev,staging,prod}`) and set the R2_* env in the
 * environment. Local MinIO via Docker is also a supported configuration
 * — same env shape, just point R2_ENDPOINT at the MinIO host.
 */

export type { StorageAdapter, StorageKey, CaseScopedKeyParts } from './types'
export {
  caseScopedKey,
  isStorageKey,
  MAX_UPLOAD_URL_EXPIRY_SECONDS,
  DEFAULT_READ_URL_EXPIRY_SECONDS,
  MAX_READ_URL_EXPIRY_SECONDS,
} from './types'
export { createMemoryStorage, type MemoryStorageAdapter } from './memory'
export { createS3Storage, type S3StorageConfig } from './s3'

export function createStorage(): StorageAdapter | MemoryStorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? 'memory'

  if (driver === 'memory') return createMemoryStorage()

  if (driver === 's3') {
    const required = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET']
    const missing = required.filter((k) => !process.env[k])
    if (missing.length > 0) {
      throw new Error(
        `STORAGE_DRIVER=s3 requires env: ${missing.join(', ')} (configure in .env.local)`,
      )
    }
    return createS3Storage({
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      endpoint: process.env.R2_ENDPOINT as string,
      bucket: process.env.R2_BUCKET as string,
      region: process.env.R2_REGION,
    })
  }

  throw new Error(`Unknown STORAGE_DRIVER: ${driver} (expected 'memory' or 's3')`)
}
