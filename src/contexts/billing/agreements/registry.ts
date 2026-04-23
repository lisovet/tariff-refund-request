import {
  CANONICAL_TRUST_PROMISE,
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
} from '@shared/disclosure/constants'
import { AUDIT_V1_BODY } from './audit-v1.body'
import { FULL_PREP_V1_BODY } from './full-prep-v1.body'

/**
 * Engagement / purchase-terms registry per PRD 06 + PRD 10.
 *
 * After the April 2026 two-tier repricing, the customer-facing SKU
 * surface is exactly two tiers:
 *
 *   - `audit`     — $99 digital-delivery clickwrap (software-only
 *                   verdict + checklist + templates).
 *   - `full-prep` — $999 base + 10 % success fee engagement letter;
 *                   carries the canonical trust promise verbatim
 *                   because this is the tier that produces a
 *                   human-reviewed submission-ready artifact.
 *
 * Every customer-facing SKU points at exactly one active agreement
 * version. When a customer countersigns (Full Prep) or clicks
 * through at checkout (Audit), the case audit log MUST record this
 * `Agreement.id` so the artifact can be traced back to the exact
 * terms the customer accepted.
 *
 * Adding a new version:
 *   1. Drop the new body module alongside the existing file
 *      (e.g. `full-prep-v2.body.ts` + `full-prep-v2.md` twin).
 *   2. Import + register it here.
 *   3. Flip `appliesTo` so the SKU resolves to the new version.
 *   4. Tests in this directory freeze the required-clause set —
 *      a missing clause FAILs CI, not discovers in prod.
 *
 * The `.body.ts` files are the bundler-compatible source of truth.
 * Twin `.md` files exist for legal review + out-of-band diffing.
 */

/**
 * Customer-facing tier identifiers the registry resolves for.
 * Matches the `TierId` union from `../tiers`, but is re-declared
 * locally so the agreements module stays legible in isolation
 * (and so a future v2 rename in `tiers.ts` fails CI here).
 */
export type AgreementSku = 'audit' | 'full-prep'

export type AgreementId = 'audit-v1' | 'full-prep-v1'

export interface Agreement {
  readonly id: AgreementId
  readonly version: number
  readonly appliesTo: readonly AgreementSku[]
  readonly body: string
}

export interface AgreementVariables {
  readonly customerName: string
  readonly customerEmail: string
  readonly caseId: string
  readonly effectiveDateIso: string
  readonly companyLegalName: string
  readonly governingLawState: string
}

export const AGREEMENTS: Readonly<Record<AgreementId, Agreement>> = {
  'audit-v1': {
    id: 'audit-v1',
    version: 1,
    appliesTo: ['audit'],
    body: AUDIT_V1_BODY,
  },
  'full-prep-v1': {
    id: 'full-prep-v1',
    version: 1,
    appliesTo: ['full-prep'],
    body: FULL_PREP_V1_BODY,
  },
} as const

export interface RequiredClause {
  readonly id:
    | 'not_legal_advice'
    | 'not_a_customs_broker'
    | 'canonical_trust_promise'
    | 'version_stamp'
  readonly probe: RegExp
  readonly applies: (skus: readonly AgreementSku[]) => boolean
}

/**
 * Non-negotiable clauses every agreement must contain. Applied by
 * the test suite — a missing clause is a shippable-agreement bug.
 *
 * `not_legal_advice` + `not_a_customs_broker` apply to every SKU
 * (baseline trust posture). `canonical_trust_promise` binds the
 * Full Prep engagement only (PRD 10 §"The trust promise (canonical)");
 * the Audit clickwrap restates the shorter "we prepare files; you
 * control submission" line and is not required to reprint the full
 * four-clause promise. `version_stamp` guarantees the rendered
 * agreement carries its own id so signed copies are traceable.
 */
export const REQUIRED_CLAUSES: readonly RequiredClause[] = [
  {
    id: 'not_legal_advice',
    probe: /not legal advice/i,
    applies: () => true,
  },
  {
    id: 'not_a_customs_broker',
    probe: /customs brokerage|customs broker/i,
    applies: () => true,
  },
  {
    id: 'canonical_trust_promise',
    probe: new RegExp(
      escapeRegex(CANONICAL_TRUST_PROMISE).replaceAll(/\s+/gu, '\\s+'),
    ),
    applies: (skus) => skus.includes('full-prep'),
  },
  {
    id: 'version_stamp',
    probe: /audit-v1|full-prep-v1/,
    applies: () => true,
  },
] as const

export function resolveAgreement(sku: AgreementSku): Agreement {
  for (const a of Object.values(AGREEMENTS)) {
    if (a.appliesTo.includes(sku)) return a
  }
  throw new Error(`no agreement registered for SKU: ${sku}`)
}

const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/gu

const VARIABLE_TO_PLACEHOLDER: Record<keyof AgreementVariables, string> = {
  customerName: 'CUSTOMER_NAME',
  customerEmail: 'CUSTOMER_EMAIL',
  caseId: 'CASE_ID',
  effectiveDateIso: 'EFFECTIVE_DATE_ISO',
  companyLegalName: 'COMPANY_LEGAL_NAME',
  governingLawState: 'GOVERNING_LAW_STATE',
}

export function renderAgreement(
  id: AgreementId,
  vars: AgreementVariables,
): string {
  const agreement = AGREEMENTS[id]
  if (!agreement) throw new Error(`unknown agreement: ${id}`)

  const vMap = new Map<string, string>()
  const lookup = vars as unknown as Record<string, string | undefined>
  for (const [key, placeholder] of Object.entries(VARIABLE_TO_PLACEHOLDER)) {
    const value = lookup[key]
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(
        `missing variable ${placeholder} (expected ${key}) when rendering ${id}`,
      )
    }
    vMap.set(placeholder, value)
  }

  return agreement.body.replace(PLACEHOLDER_RE, (_m, key: string) => {
    const value = vMap.get(key)
    if (value === undefined) {
      throw new Error(`missing variable ${key} when rendering ${id}`)
    }
    return value
  })
}

export {
  CANONICAL_TRUST_PROMISE,
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}
