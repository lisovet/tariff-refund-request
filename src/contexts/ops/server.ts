import 'server-only'
import { createDbClient } from '@shared/infra/db/client'
import { createDrizzleCaseRepo } from './drizzle-repo'
import { createInMemoryCaseRepo } from './in-memory-repo'
import type { CaseRepo } from './repo'

/**
 * Server-only entry for the ops context. Route handlers + Inngest
 * workflows import from here; client code imports from `@contexts/ops`
 * (UI-safe surface — pure types + the transition() helper).
 */

export { createInMemoryCaseRepo } from './in-memory-repo'
export { createDrizzleCaseRepo } from './drizzle-repo'
export { auditLogMirrorWorkflow } from './workflows/audit-log-mirror'
export { stalledCadenceWorkflow } from './workflows/stalled-cadence'

let cachedRepo: CaseRepo | undefined

export function getCaseRepo(): CaseRepo {
  if (cachedRepo) return cachedRepo
  if (process.env.DATABASE_URL) {
    cachedRepo = createDrizzleCaseRepo(createDbClient())
  } else {
    cachedRepo = createInMemoryCaseRepo()
  }
  return cachedRepo
}

export function resetOps(): void {
  cachedRepo = undefined
}
