/**
 * Funnel events — public surface. Per PRD 00 §9 and ADR 013:
 * a single structured-log catalog that downstream Axiom
 * dashboards aggregate on.
 *
 * Platform code reaches for the helpers in `./events.ts`; the
 * Inngest fan-out workflows live in `./mirror-workflow.ts`
 * behind a `server-only` guard.
 */

export type {
  EmitFunnelDeps,
  FunnelCaseTransitionInput,
  FunnelEvent,
  FunnelEventKind,
  FunnelEventLogger,
} from './events'
export {
  FUNNEL_EVENT_KINDS,
  emitFunnelEvent,
  emitFunnelCaseTransition,
} from './events'
