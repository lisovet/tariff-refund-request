import { Axiom } from '@axiomhq/js'
import type { LogAttributes, Logger } from './types'

/**
 * Axiom-backed logger. Per ADR 013: Axiom holds structured logs + the
 * audit-log mirror. Active only when AXIOM_TOKEN + AXIOM_DATASET are
 * present; the factory wires the no-op fallback otherwise.
 */

export interface AxiomLoggerConfig {
  readonly token: string
  readonly dataset: string
  readonly serviceName?: string
  readonly env?: string
}

export function createAxiomLogger(config: AxiomLoggerConfig): Logger {
  const client = new Axiom({ token: config.token })
  const baseAttrs = {
    service: config.serviceName ?? 'tariff-refund-platform',
    env: config.env ?? process.env.NODE_ENV ?? 'development',
  }

  function emit(level: 'info' | 'warn' | 'error', message: string, attrs?: LogAttributes) {
    client.ingest(config.dataset, [
      {
        _time: new Date().toISOString(),
        level,
        message,
        ...baseAttrs,
        ...(attrs ?? {}),
      },
    ])
  }

  return {
    info(message, attrs) {
      emit('info', message, attrs)
    },
    warn(message, attrs) {
      emit('warn', message, attrs)
    },
    error(message, attrs) {
      emit('error', message, attrs)
    },
    async flush() {
      await client.flush()
    },
    isActive() {
      return true
    },
  }
}
