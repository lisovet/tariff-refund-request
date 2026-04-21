/**
 * Outreach kit templates per PRD 02. Each path has its own template
 * file (broker.ts / carrier.ts / ace.ts / mixed.ts) so wording lives
 * next to its variant; the registry in templates/index.ts wires
 * them up.
 *
 * Templates are versioned at the module level (OUTREACH_TEMPLATE_VERSION).
 * When wording changes, bump the version + update the snapshots so
 * the diff is auditable.
 */

import type { RecoveryPath } from '../routing'

/** Bump on every wording or token-shape change. */
export const OUTREACH_TEMPLATE_VERSION = 'v1'

/**
 * Tokens that the outreach copy may reference. Not every template
 * uses every token; the renderer asserts that all tokens declared in
 * the chosen template's `placeholders` are present.
 */
export interface OutreachKitTokens {
  /** Customer's broker name (broker / mixed paths). */
  readonly brokerName?: string
  /** Customer's company / IOR display name. */
  readonly importerName: string
  /** ISO date (YYYY-MM-DD) — start of the IEEPA recovery window. */
  readonly windowStart: string
  /** ISO date (YYYY-MM-DD) — end of the IEEPA recovery window. */
  readonly windowEnd: string
}

export interface OutreachKitTemplate {
  readonly version: string
  readonly path: RecoveryPath
  readonly subject: string
  readonly body: string
  /**
   * Placeholders the renderer MUST find in `tokens`. If any are
   * missing the renderer throws — partial sends would leave
   * `{{brokerName}}` literals in customer-facing email.
   */
  readonly placeholders: readonly (keyof OutreachKitTokens)[]
}

export interface RenderedOutreachKit {
  readonly version: string
  readonly path: RecoveryPath
  readonly subject: string
  readonly body: string
}
