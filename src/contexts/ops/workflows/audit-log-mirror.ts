import { inngest } from '@shared/infra/inngest/client'
import { caseStateTransitioned } from '@shared/infra/inngest/events'
import type { Logger } from '@shared/infra/observability'

/**
 * Audit-log Axiom mirror per ADR 013 + task #42. Best-effort: never
 * blocks the transactional case-state write; failures retry via
 * Inngest. The transaction has already committed by the time this
 * workflow runs — the mirror is for observability + downstream
 * analytics, not for correctness.
 *
 * The handler is exported separately so unit tests bypass the
 * Inngest wrapper and inject a fake logger.
 */

export interface AuditMirrorEventData {
  readonly caseId: string
  readonly auditId: string
  readonly kind: string
  readonly from: string
  readonly to: string
  readonly actorId: string
  readonly occurredAt: string
}

export interface AuditMirrorHandlerInput {
  readonly event: { id?: string; data: AuditMirrorEventData }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
  }
}

export interface AuditMirrorHandlerDeps {
  readonly logger: Logger
}

export interface AuditMirrorResult {
  readonly mirrored: boolean
}

export async function auditLogMirrorHandler(
  input: AuditMirrorHandlerInput,
  deps: AuditMirrorHandlerDeps,
): Promise<AuditMirrorResult> {
  const { event, step } = input

  if (!deps.logger.isActive()) {
    // No Axiom credentials in this env — surface that the mirror was
    // a no-op without failing the workflow. Inngest will record the
    // success and not retry. When AXIOM_TOKEN lands, the mirror
    // turns on without code changes.
    return step.run('mirror-skipped', async () => ({ mirrored: false }))
  }

  await step.run('emit-axiom', async () => {
    deps.logger.info('audit_log.mirror', {
      caseId: event.data.caseId,
      auditId: event.data.auditId,
      kind: event.data.kind,
      from: event.data.from,
      to: event.data.to,
      actorId: event.data.actorId,
      occurredAt: event.data.occurredAt,
    })
  })

  return { mirrored: true }
}

export const auditLogMirrorWorkflow = inngest.createFunction(
  { id: 'audit-log-mirror', triggers: [caseStateTransitioned] },
  async (input) => {
    const { getLogger } = await import('@shared/infra/observability')
    const adapted = input as unknown as AuditMirrorHandlerInput
    return auditLogMirrorHandler(adapted, { logger: getLogger() })
  },
)
