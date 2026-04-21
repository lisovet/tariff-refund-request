import { createAxiomLogger } from './axiom'
import { createNoopErrorTracker, createNoopLogger } from './noop'
import { createSentryErrorTracker } from './sentry'
import type { ErrorTracker, Logger } from './types'

/**
 * Observability factory. Platform code calls `getLogger()` /
 * `getErrorTracker()` and never branches on env itself; the factory
 * picks the active transport (Axiom / Sentry) when keys are present
 * and falls back to no-op transports otherwise.
 *
 * TODO(human-action): provision Sentry + Axiom and set SENTRY_DSN,
 * AXIOM_TOKEN, AXIOM_DATASET in the environment.
 */

export type { Logger, ErrorTracker, BreadcrumbPayload, LogAttributes, LogLevel } from './types'

let cachedLogger: Logger | undefined
let cachedTracker: ErrorTracker | undefined

export function getLogger(): Logger {
  if (cachedLogger) return cachedLogger
  const token = process.env.AXIOM_TOKEN
  const dataset = process.env.AXIOM_DATASET
  if (token && dataset) {
    cachedLogger = createAxiomLogger({ token, dataset })
  } else {
    cachedLogger = createNoopLogger()
  }
  return cachedLogger
}

export function getErrorTracker(): ErrorTracker {
  if (cachedTracker) return cachedTracker
  const dsn = process.env.SENTRY_DSN
  if (dsn) {
    cachedTracker = createSentryErrorTracker({ dsn })
  } else {
    cachedTracker = createNoopErrorTracker()
  }
  return cachedTracker
}

/** Test-only: clear the cached transports so env changes can take effect. */
export function resetObservability(): void {
  cachedLogger = undefined
  cachedTracker = undefined
}
