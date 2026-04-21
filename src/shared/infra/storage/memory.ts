import {
  DEFAULT_READ_URL_EXPIRY_SECONDS,
  MAX_READ_URL_EXPIRY_SECONDS,
  MAX_UPLOAD_URL_EXPIRY_SECONDS,
  type StorageAdapter,
  type StorageKey,
  isStorageKey,
} from './types'

interface StoredVersion {
  readonly body: Buffer
  readonly contentType?: string
  readonly storedAt: Date
}

export interface MemoryStorageAdapter extends StorageAdapter {
  /** Inspect the version history for a key. Test-only. */
  listVersions(key: StorageKey): readonly StoredVersion[]
}

/**
 * In-memory storage adapter. Used for unit tests and as a dev fallback
 * when neither real R2 nor a local MinIO container is available. Every
 * write appends a version (per ADR 006: documents are immutable; we never
 * overwrite). The latest version is what `getObject` returns.
 */
export function createMemoryStorage(): MemoryStorageAdapter {
  const store = new Map<StorageKey, StoredVersion[]>()

  function assertCaseScoped(key: StorageKey): void {
    if (!isStorageKey(key)) {
      throw new Error(`storage key must be case-scoped: ${key}`)
    }
  }

  function latest(key: StorageKey): StoredVersion | undefined {
    const versions = store.get(key)
    return versions?.[versions.length - 1]
  }

  return {
    async putObject(key, body, contentType) {
      assertCaseScoped(key)
      const versions = store.get(key) ?? []
      versions.push({ body, contentType, storedAt: new Date() })
      store.set(key, versions)
    },

    async getObject(key) {
      assertCaseScoped(key)
      const head = latest(key)
      if (head === undefined) throw new Error(`object not found: ${key}`)
      return head.body
    },

    async deleteObject(key) {
      assertCaseScoped(key)
      store.delete(key)
    },

    async headObject(key) {
      assertCaseScoped(key)
      const head = latest(key)
      if (head === undefined) return { exists: false }
      return { exists: true, size: head.body.byteLength }
    },

    async getSignedUploadUrl(key, contentType, expirySeconds = MAX_UPLOAD_URL_EXPIRY_SECONDS) {
      assertCaseScoped(key)
      if (expirySeconds > MAX_UPLOAD_URL_EXPIRY_SECONDS) {
        throw new Error(
          `upload URL expiry must be ≤ ${MAX_UPLOAD_URL_EXPIRY_SECONDS}s (got ${expirySeconds})`,
        )
      }
      const expires = Date.now() + expirySeconds * 1000
      return `memory://upload/${encodeURIComponent(key)}?contentType=${encodeURIComponent(contentType)}&expires=${expires}`
    },

    async getSignedReadUrl(key, expirySeconds = DEFAULT_READ_URL_EXPIRY_SECONDS) {
      assertCaseScoped(key)
      if (expirySeconds > MAX_READ_URL_EXPIRY_SECONDS) {
        throw new Error(
          `read URL expiry must be ≤ ${MAX_READ_URL_EXPIRY_SECONDS}s (got ${expirySeconds})`,
        )
      }
      if (latest(key) === undefined) throw new Error(`object not found: ${key}`)
      const expires = Date.now() + expirySeconds * 1000
      return `memory://read/${encodeURIComponent(key)}?expires=${expires}`
    },

    listVersions(key) {
      return store.get(key) ?? []
    },
  }
}
