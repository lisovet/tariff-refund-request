import type { ErrorTracker, Logger } from './types'

/**
 * No-op transports. Used when SENTRY_DSN / AXIOM_TOKEN are missing,
 * keeping the platform runnable in dev / tests without any observability
 * accounts. Calls are silently swallowed; nothing throws.
 */

export function createNoopLogger(): Logger {
  return {
    info() {},
    warn() {},
    error() {},
    async flush() {},
    isActive() {
      return false
    },
  }
}

export function createNoopErrorTracker(): ErrorTracker {
  return {
    captureException() {},
    captureMessage() {},
    addBreadcrumb() {},
    isActive() {
      return false
    },
  }
}
