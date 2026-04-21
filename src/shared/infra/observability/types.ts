/**
 * Observability primitives. Per ADR 013:
 * - Sentry tracks errors + performance (browser + server + Inngest).
 * - Axiom holds structured logs and the audit-log mirror.
 *
 * The platform code imports these interfaces and never references the
 * concrete vendors. The factory in `./index.ts` returns either a real
 * transport (when env is configured) or a no-op (when env is missing,
 * per .ralph/PROMPT.md local-stub policy).
 */

export type LogLevel = 'info' | 'warn' | 'error'

export type LogAttributes = Readonly<Record<string, unknown>>

export interface Logger {
  info(message: string, attrs?: LogAttributes): void
  warn(message: string, attrs?: LogAttributes): void
  error(message: string, attrs?: LogAttributes): void
  flush(): Promise<void>
  isActive(): boolean
}

export interface BreadcrumbPayload {
  readonly category: string
  readonly message: string
  readonly data?: Readonly<Record<string, unknown>>
  readonly level?: LogLevel
}

export interface ErrorTracker {
  captureException(error: unknown, context?: LogAttributes): void
  captureMessage(message: string, context?: LogAttributes): void
  addBreadcrumb(crumb: BreadcrumbPayload): void
  isActive(): boolean
}
