import 'server-only'
import { createDbClient } from '@shared/infra/db/client'
import { createStorage } from '@shared/infra/storage'
import type { StorageAdapter } from '@shared/infra/storage'
import { createDrizzleDocumentRepo } from './drizzle-document-repo'
import { createInMemoryDocumentRepo } from './in-memory-document-repo'
import type { DocumentRepo } from './document-repo'

/**
 * Server-only entry for the recovery context. Routes + Inngest
 * workflows pull from here; client code uses `@contexts/recovery`
 * (UI-safe surface).
 */

export { createInMemoryDocumentRepo } from './in-memory-document-repo'
export { createDrizzleDocumentRepo } from './drizzle-document-repo'

let cachedRepo: DocumentRepo | undefined
let cachedStorage: StorageAdapter | undefined

export function getDocumentRepo(): DocumentRepo {
  if (cachedRepo) return cachedRepo
  if (process.env.DATABASE_URL) {
    cachedRepo = createDrizzleDocumentRepo(createDbClient())
  } else {
    cachedRepo = createInMemoryDocumentRepo()
  }
  return cachedRepo
}

export function getRecoveryStorage(): StorageAdapter {
  if (cachedStorage) return cachedStorage
  cachedStorage = createStorage()
  return cachedStorage
}

export function resetRecovery(): void {
  cachedRepo = undefined
  cachedStorage = undefined
}
