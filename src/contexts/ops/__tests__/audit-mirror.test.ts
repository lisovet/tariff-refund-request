import { describe, expect, it, vi } from 'vitest'
import { auditLogMirrorHandler } from '../workflows/audit-log-mirror'
import type { Logger } from '@shared/infra/observability'

function makeLogger(): {
  logger: Logger
  calls: Array<{ level: string; message: string; attrs?: Record<string, unknown> }>
} {
  const calls: Array<{
    level: string
    message: string
    attrs?: Record<string, unknown>
  }> = []
  const record = (level: string) => (message: string, attrs?: Record<string, unknown>) => {
    calls.push({ level, message, attrs })
  }
  return {
    calls,
    logger: {
      info: record('info'),
      warn: record('warn'),
      error: record('error'),
      flush: vi.fn(async () => {}),
      isActive: () => true,
    },
  }
}

function makeStep() {
  return {
    run: async <T>(_name: string, fn: () => T | Promise<T>) => fn(),
  }
}

describe('auditLogMirrorHandler', () => {
  it('emits a structured audit_log mirror entry at info level', async () => {
    const { logger, calls } = makeLogger()
    const result = await auditLogMirrorHandler(
      {
        event: {
          data: {
            caseId: 'cas_abc',
            auditId: 'aud_123',
            kind: 'VALIDATOR_SIGNED_OFF',
            from: 'batch_qa',
            to: 'submission_ready',
            actorId: 'stf_v',
            occurredAt: '2026-04-21T10:00:00Z',
          },
        },
        step: makeStep(),
      },
      { logger },
    )

    expect(result.mirrored).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.level).toBe('info')
    expect(calls[0]?.message).toBe('audit_log.mirror')
    expect(calls[0]?.attrs).toEqual({
      caseId: 'cas_abc',
      auditId: 'aud_123',
      kind: 'VALIDATOR_SIGNED_OFF',
      from: 'batch_qa',
      to: 'submission_ready',
      actorId: 'stf_v',
      occurredAt: '2026-04-21T10:00:00Z',
    })
  })

  it('returns mirrored=false when the logger is a no-op (AXIOM_TOKEN missing)', async () => {
    const logger: Logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      flush: vi.fn(async () => {}),
      isActive: () => false,
    }
    const result = await auditLogMirrorHandler(
      {
        event: {
          data: {
            caseId: 'cas_abc',
            auditId: 'aud_1',
            kind: 'SCREENER_RESULT_QUALIFIED',
            from: 'new_lead',
            to: 'qualified',
            actorId: 'system',
            occurredAt: '2026-04-21T10:00:00Z',
          },
        },
        step: makeStep(),
      },
      { logger },
    )
    // No-op logger → mirror is reported as not-delivered so Inngest
    // observability reflects reality, but the workflow does NOT throw
    // (best-effort per ADR 013 + task #42's policy).
    expect(result.mirrored).toBe(false)
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('rethrows when the logger itself throws (so Inngest retries)', async () => {
    const boom = new Error('axiom ingest rejected')
    const logger: Logger = {
      info: vi.fn(() => {
        throw boom
      }),
      warn: vi.fn(),
      error: vi.fn(),
      flush: vi.fn(async () => {}),
      isActive: () => true,
    }
    await expect(
      auditLogMirrorHandler(
        {
          event: {
            data: {
              caseId: 'cas_abc',
              auditId: 'aud_1',
              kind: 'SCREENER_RESULT_QUALIFIED',
              from: 'new_lead',
              to: 'qualified',
              actorId: 'system',
              occurredAt: '2026-04-21T10:00:00Z',
            },
          },
          step: makeStep(),
        },
        { logger },
      ),
    ).rejects.toThrow(/axiom ingest rejected/)
  })
})
