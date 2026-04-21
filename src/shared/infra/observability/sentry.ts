import * as Sentry from '@sentry/nextjs'
import type { BreadcrumbPayload, ErrorTracker, LogAttributes, LogLevel } from './types'

const SENTRY_LEVEL: Record<LogLevel, Sentry.SeverityLevel> = {
  info: 'info',
  warn: 'warning',
  error: 'error',
}

/**
 * Sentry-backed error tracker. Per ADR 013: errors + performance on
 * browser + server + Inngest. The Next.js SDK auto-instruments most
 * surfaces; this adapter is what platform code calls explicitly.
 *
 * Active only when SENTRY_DSN is present; the factory wires the no-op
 * fallback otherwise.
 */

export interface SentryConfig {
  readonly dsn: string
  readonly env?: string
}

export function createSentryErrorTracker(config: SentryConfig): ErrorTracker {
  return {
    captureException(error, context) {
      Sentry.captureException(error, context ? { extra: { ...context } } : undefined)
    },
    captureMessage(message, context) {
      Sentry.captureMessage(message, context ? { extra: { ...context } } : undefined)
    },
    addBreadcrumb(crumb: BreadcrumbPayload) {
      Sentry.addBreadcrumb({
        category: crumb.category,
        message: crumb.message,
        data: crumb.data as LogAttributes | undefined,
        level: crumb.level ? SENTRY_LEVEL[crumb.level] : undefined,
      })
    },
    isActive() {
      return Boolean(config.dsn)
    },
  }
}
