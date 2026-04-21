import { smokeHelloWorld } from './smoke-hello-world'

/**
 * Workflows registry. Mounted by the Next route handler at /api/inngest.
 * Downstream tasks append their workflows here:
 *
 * - lifecycle email cadences (PRD 05) — task #28..#31
 * - case state-transition events (PRD 04) — task #41
 * - audit-log Axiom mirror (ADR 013) — task #42
 * - artifact generation pipeline (PRD 03) — task #70
 * - stalled-case nudges (PRD 04) — task #30
 */
export const workflows = [smokeHelloWorld] as const

export { smokeHelloWorld }
