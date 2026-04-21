import 'server-only'
import { inngest } from '@shared/infra/inngest/client'
import {
  batchSignedOff,
  caseStateTransitioned,
  conciergeSigned,
  paymentCompleted,
  screenerCompleted,
} from '@shared/infra/inngest/events'
import { getLogger } from '@shared/infra/observability'
import {
  emitFunnelCaseTransition,
  emitFunnelEvent,
  type EmitFunnelDeps,
} from './events'

/**
 * One Inngest workflow fans the platform's typed events into the
 * funnel emitter. Per ADR 013: the Axiom logger is the single sink
 * for structured analytics; this workflow keeps funnel emission
 * out-of-band from the business services so a downstream logger
 * outage never stalls a real case.
 */

function resolveDeps(): EmitFunnelDeps {
  return { logger: getLogger() }
}

export const funnelScreenerCompletedHandler = async (event: {
  id?: string
  data: { sessionId: string; email: string; company: string | null }
}) => {
  emitFunnelEvent(
    {
      kind: 'screener.completed',
      at: new Date().toISOString(),
      caseId: null,
      attrs: {
        sessionId: event.data.sessionId,
        hasCompany: event.data.company !== null,
      },
    },
    resolveDeps(),
  )
}

export const funnelPaymentCompletedHandler = async (event: {
  id?: string
  data: {
    sessionId: string
    sku: string
    stripeChargeId: string
    amountUsdCents: number
    email: string
  }
}) => {
  const kind = skuToFunnelKind(event.data.sku)
  if (!kind) return
  emitFunnelEvent(
    {
      kind,
      at: new Date().toISOString(),
      caseId: null,
      attrs: {
        sessionId: event.data.sessionId,
        sku: event.data.sku,
        stripeChargeId: event.data.stripeChargeId,
        amountUsdCents: event.data.amountUsdCents,
      },
    },
    resolveDeps(),
  )
}

export const funnelConciergeSignedHandler = async (event: {
  id?: string
  data: { caseId: string; envelopeId: string; signedAtIso: string }
}) => {
  emitFunnelEvent(
    {
      kind: 'concierge.signed',
      at: event.data.signedAtIso,
      caseId: event.data.caseId,
      attrs: { envelopeId: event.data.envelopeId },
    },
    resolveDeps(),
  )
}

export const funnelBatchSignedOffHandler = async (event: {
  id?: string
  data: {
    caseId: string
    batchId: string
    signedAtIso: string
    analystId: string
  }
}) => {
  emitFunnelEvent(
    {
      kind: 'batch.signed_off',
      at: event.data.signedAtIso,
      caseId: event.data.caseId,
      attrs: {
        batchId: event.data.batchId,
        analystId: event.data.analystId,
      },
    },
    resolveDeps(),
  )
}

export const funnelCaseStateTransitionedHandler = async (event: {
  id?: string
  data: {
    caseId: string
    auditId: string
    kind: string
    from: string
    to: string
    actorId: string
    occurredAt: string
  }
}) => {
  const deps = resolveDeps()
  emitFunnelCaseTransition(
    {
      caseId: event.data.caseId,
      from: event.data.from as Parameters<typeof emitFunnelCaseTransition>[0]['from'],
      to: event.data.to as Parameters<typeof emitFunnelCaseTransition>[0]['to'],
      actorId: event.data.actorId,
      occurredAtIso: event.data.occurredAt,
    },
    deps,
  )
}

function skuToFunnelKind(
  sku: string,
):
  | 'recovery.purchased'
  | 'prep.purchased'
  | 'concierge.purchased'
  | undefined {
  if (sku.startsWith('recovery_')) return 'recovery.purchased'
  if (sku.startsWith('cape_prep')) return 'prep.purchased'
  if (sku.startsWith('concierge')) return 'concierge.purchased'
  return undefined
}

/**
 * The Inngest-typed event shapes are wider than our handler inputs
 * (they include a framework-internal function-invoked event). We
 * adapt through `unknown` — the trigger filter guarantees only the
 * nominated event reaches the handler.
 */

export const funnelScreenerCompletedWorkflow = inngest.createFunction(
  { id: 'funnel-screener-completed', triggers: [screenerCompleted] },
  async ({ event }) =>
    funnelScreenerCompletedHandler(
      event as unknown as Parameters<typeof funnelScreenerCompletedHandler>[0],
    ),
)

export const funnelPaymentCompletedWorkflow = inngest.createFunction(
  { id: 'funnel-payment-completed', triggers: [paymentCompleted] },
  async ({ event }) =>
    funnelPaymentCompletedHandler(
      event as unknown as Parameters<typeof funnelPaymentCompletedHandler>[0],
    ),
)

export const funnelConciergeSignedWorkflow = inngest.createFunction(
  { id: 'funnel-concierge-signed', triggers: [conciergeSigned] },
  async ({ event }) =>
    funnelConciergeSignedHandler(
      event as unknown as Parameters<typeof funnelConciergeSignedHandler>[0],
    ),
)

export const funnelBatchSignedOffWorkflow = inngest.createFunction(
  { id: 'funnel-batch-signed-off', triggers: [batchSignedOff] },
  async ({ event }) =>
    funnelBatchSignedOffHandler(
      event as unknown as Parameters<typeof funnelBatchSignedOffHandler>[0],
    ),
)

export const funnelCaseTransitionedWorkflow = inngest.createFunction(
  { id: 'funnel-case-state-transitioned', triggers: [caseStateTransitioned] },
  async ({ event }) =>
    funnelCaseStateTransitionedHandler(
      event as unknown as Parameters<typeof funnelCaseStateTransitionedHandler>[0],
    ),
)

export const funnelMirrorWorkflows = [
  funnelScreenerCompletedWorkflow,
  funnelPaymentCompletedWorkflow,
  funnelConciergeSignedWorkflow,
  funnelBatchSignedOffWorkflow,
  funnelCaseTransitionedWorkflow,
] as const
