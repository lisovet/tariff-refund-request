import { auditLogMirrorWorkflow } from '@contexts/ops/server'
import {
  nudgeCadenceWorkflow,
  screenerCompletedWorkflow,
} from '@contexts/screener/server'
import { smokeHelloWorld } from './smoke-hello-world'

/**
 * Workflows registry. Mounted by the Next route handler at /api/inngest.
 * Downstream tasks append their workflows here:
 *
 * - lifecycle email cadences (PRD 05) — tasks #29..#31 (24h, 72h, etc.)
 * - case state-transition events (PRD 04) — task #41
 * - audit-log Axiom mirror (ADR 013) — task #42
 * - artifact generation pipeline (PRD 03) — task #70
 * - stalled-case nudges (PRD 04) — task #30
 *
 * Workflows live next to the domain code they serve and are
 * re-exported from each context's `server.ts` (per ADR 001's
 * public-surface boundary). The registry just wires them together.
 */
export const workflows = [
  smokeHelloWorld,
  screenerCompletedWorkflow,
  nudgeCadenceWorkflow,
  auditLogMirrorWorkflow,
] as const

export {
  smokeHelloWorld,
  screenerCompletedWorkflow,
  nudgeCadenceWorkflow,
  auditLogMirrorWorkflow,
}
