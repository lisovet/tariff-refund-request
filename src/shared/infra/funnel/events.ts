import type { CaseState } from '@contexts/ops'

/**
 * Funnel event catalog per PRD 00 §9. We emit these to the
 * Axiom-shaped logger tagged `funnel: true` so the product
 * dashboard can pivot on the kind + attrs.
 *
 * No third-party analytics on customer surfaces — everything
 * routes through our own observability transport (ADR 013).
 */

export const FUNNEL_EVENT_KINDS = [
  'screener.completed',
  'screener.qualified',
  'recovery.purchased',
  'prep.purchased',
  'concierge.signed',
  'concierge.purchased',
  'batch.signed_off',
  'case.filed',
  'case.paid',
  'case.state_transitioned',
] as const

export type FunnelEventKind = (typeof FUNNEL_EVENT_KINDS)[number]

export interface FunnelEvent {
  readonly kind: FunnelEventKind
  readonly at: string // ISO 8601
  readonly caseId: string | null
  readonly attrs: Readonly<Record<string, unknown>>
}

/**
 * The slice of `Logger` needed for funnel emission. We decouple so
 * tests can pass a spy without pulling in the real Axiom + Sentry
 * factory chain.
 */
export interface FunnelEventLogger {
  info(message: string, attrs?: Readonly<Record<string, unknown>>): void
}

export interface EmitFunnelDeps {
  readonly logger: FunnelEventLogger
}

/**
 * Fire a single funnel event. Side-effect only: the dispatcher
 * swallows logger errors so a downstream transport failure never
 * corrupts the calling workflow. The Axiom logger already handles
 * its own retry / buffer semantics under the hood.
 */
export function emitFunnelEvent(event: FunnelEvent, deps: EmitFunnelDeps): void {
  try {
    deps.logger.info(`funnel:${event.kind}`, {
      funnel: true,
      kind: event.kind,
      at: event.at,
      caseId: event.caseId,
      ...event.attrs,
    })
  } catch {
    // Never propagate — funnel emission is observability, not
    // business logic.
  }
}

/**
 * Translate a case state transition into the right funnel events.
 * Every transition emits the fine-grained `case.state_transitioned`
 * event AND the coarse funnel kind when the destination maps to a
 * ladder event (e.g., `paid`, `filed`, `submission_ready`).
 */
export interface FunnelCaseTransitionInput {
  readonly caseId: string
  readonly from: CaseState
  readonly to: CaseState
  readonly actorId: string | null
  readonly occurredAtIso: string
}

const TO_STATE_TO_FUNNEL: Partial<Record<CaseState, FunnelEventKind>> = {
  qualified: 'screener.qualified',
  submission_ready: 'batch.signed_off',
  filed: 'case.filed',
  paid: 'case.paid',
}

export function emitFunnelCaseTransition(
  input: FunnelCaseTransitionInput,
  deps: EmitFunnelDeps,
): void {
  emitFunnelEvent(
    {
      kind: 'case.state_transitioned',
      at: input.occurredAtIso,
      caseId: input.caseId,
      attrs: {
        from: input.from,
        to: input.to,
        actorId: input.actorId,
      },
    },
    deps,
  )
  const mapped = TO_STATE_TO_FUNNEL[input.to]
  if (mapped) {
    emitFunnelEvent(
      {
        kind: mapped,
        at: input.occurredAtIso,
        caseId: input.caseId,
        attrs: { from: input.from, to: input.to, actorId: input.actorId },
      },
      deps,
    )
  }
}
