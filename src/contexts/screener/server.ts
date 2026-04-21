import 'server-only'
import { createDbClient } from '@shared/infra/db/client'
import { createDrizzleScreenerRepo } from './drizzle-repo'
import { createInMemoryScreenerRepo } from './in-memory-repo'
import type { ScreenerRepo } from './repo'

/**
 * Server-only entry point for the screener context. Route handlers,
 * Inngest workflows, and any code running in the Next.js Node runtime
 * import from `@contexts/screener/server`. Client code imports from
 * `@contexts/screener` (which exports only pure helpers + types).
 *
 * The `server-only` import causes a build-time error if this module is
 * accidentally pulled into a client bundle.
 */

export { createInMemoryScreenerRepo } from './in-memory-repo'
export { createDrizzleScreenerRepo } from './drizzle-repo'
export {
  signToken,
  verifyToken,
  type MagicLinkPayload,
  type SignOptions,
  type VerifyOptions,
  type VerifyResult,
} from './magic-link'
export {
  finalizeScreener,
  type FinalizeInput,
  type FinalizeOutput,
  type FinalizeDeps,
} from './finalize'
export {
  screenerCompletedWorkflow,
  screenerCompletedHandler,
  type ScreenerCompletedHandlerInput,
  type ScreenerCompletedHandlerDeps,
  type ScreenerCompletedResult,
} from './workflows/screener-completed'

let cachedRepo: ScreenerRepo | undefined

export function getScreenerRepo(): ScreenerRepo {
  if (cachedRepo) return cachedRepo
  if (process.env.DATABASE_URL) {
    cachedRepo = createDrizzleScreenerRepo(createDbClient())
  } else {
    cachedRepo = createInMemoryScreenerRepo()
  }
  return cachedRepo
}

export function resetScreenerRepo(): void {
  cachedRepo = undefined
}
