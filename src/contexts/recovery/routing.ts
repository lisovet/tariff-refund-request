import type { ScreenerAnswers } from '@contexts/screener'
import type { DocumentKind, RecoveryPath as SchemaRecoveryPath } from '@shared/infra/db/schema'
import { OUTREACH_KIT_TEMPLATES } from './templates'

/**
 * Recovery routing per ADR 015 + PRD 02.
 *
 *   determineRecoveryPath(answers) — pure: maps the screener's
 *     clearance-path answer (q4) to the recovery path the workspace
 *     will use. Returns null on disqualification.
 *
 *   recoveryPlanFor(path) — typed RecoveryPlan. UI + ops console
 *     read from the plan; they NEVER branch on `path` per ADR 015's
 *     "no-recovery-path-conditionals" rule.
 *
 * Plan content is frozen by snapshot tests so any change is visible
 * in PR review.
 */

export type RecoveryPath = 'broker' | 'carrier' | 'ace-self-export' | 'mixed'

export const RECOVERY_QUEUES = {
  broker: 'recovery-broker',
  carrier: 'recovery-carrier',
  ace: 'recovery-ace',
} as const

export interface OutreachEmailTemplate {
  readonly subject: string
  /** Body copy with `{{placeholders}}` filled at render time. */
  readonly body: string
  readonly placeholders: readonly string[]
}

export interface RecoverySLA {
  readonly firstTouchHours: number
  readonly completionHours: number
}

export interface PrerequisiteCheck {
  readonly id: 'ace_account' | 'ach_on_file' | 'ior_status' | 'broker_relationship' | 'carrier_account'
  readonly label: string
  readonly required: boolean
}

export interface RecoveryPlan {
  readonly path: RecoveryPath
  readonly outreachTemplate: OutreachEmailTemplate
  readonly acceptedDocs: readonly DocumentKind[]
  readonly opsQueue: string
  readonly sla: RecoverySLA
  readonly prerequisiteChecks: readonly PrerequisiteCheck[]
}

export function determineRecoveryPath(
  answers: ScreenerAnswers,
): RecoveryPath | null {
  // Disqualification shortcut — matches qualification.ts so the recovery
  // workspace never opens for a disqualified case.
  if (answers.q1 === 'no') return null
  if (answers.q3 === 'no') return null
  switch (answers.q4) {
    case 'broker':
      return 'broker'
    case 'carrier':
      return 'carrier'
    case 'ace_self_filed':
      return 'ace-self-export'
    case 'mixed':
      return 'mixed'
    default:
      return null
  }
}

const BROKER_PLAN: RecoveryPlan = {
  path: 'broker',
  outreachTemplate: planTemplate('broker'),
  acceptedDocs: ['broker_7501', 'broker_spreadsheet', 'other'] as const,
  opsQueue: RECOVERY_QUEUES.broker,
  sla: { firstTouchHours: 4, completionHours: 24 },
  prerequisiteChecks: [
    { id: 'ior_status', label: 'You are the importer of record', required: true },
    { id: 'broker_relationship', label: 'Broker contact email available', required: true },
    { id: 'ach_on_file', label: 'ACH refund authorization on file', required: false },
  ] as const,
} as const

const CARRIER_PLAN: RecoveryPlan = {
  path: 'carrier',
  outreachTemplate: planTemplate('carrier'),
  acceptedDocs: ['carrier_invoice', 'broker_7501', 'other'] as const,
  opsQueue: RECOVERY_QUEUES.carrier,
  sla: { firstTouchHours: 4, completionHours: 48 },
  prerequisiteChecks: [
    { id: 'ior_status', label: 'You are the importer of record', required: true },
    { id: 'carrier_account', label: 'Carrier portal credentials available', required: true },
    { id: 'ach_on_file', label: 'ACH refund authorization on file', required: false },
  ] as const,
} as const

const ACE_PLAN: RecoveryPlan = {
  path: 'ace-self-export',
  outreachTemplate: planTemplate('ace-self-export'),
  acceptedDocs: ['ace_export', 'other'] as const,
  opsQueue: RECOVERY_QUEUES.ace,
  sla: { firstTouchHours: 8, completionHours: 24 },
  prerequisiteChecks: [
    { id: 'ace_account', label: 'Active ACE Portal account', required: true },
    { id: 'ior_status', label: 'You are the importer of record', required: true },
    { id: 'ach_on_file', label: 'ACH refund authorization on file', required: false },
  ] as const,
} as const

const MIXED_PLAN: RecoveryPlan = {
  path: 'mixed',
  outreachTemplate: planTemplate('mixed'),
  acceptedDocs: [
    'ace_export',
    'broker_7501',
    'broker_spreadsheet',
    'carrier_invoice',
    'other',
  ] as const,
  opsQueue: RECOVERY_QUEUES.broker,
  sla: { firstTouchHours: 4, completionHours: 48 },
  prerequisiteChecks: [
    { id: 'ior_status', label: 'You are the importer of record', required: true },
    { id: 'broker_relationship', label: 'Broker contact email available', required: false },
    { id: 'carrier_account', label: 'Carrier portal credentials available', required: false },
    { id: 'ace_account', label: 'Active ACE Portal account', required: false },
    { id: 'ach_on_file', label: 'ACH refund authorization on file', required: false },
  ] as const,
} as const

function planTemplate(path: RecoveryPath): OutreachEmailTemplate {
  const tpl = OUTREACH_KIT_TEMPLATES[path]
  return {
    subject: tpl.subject,
    body: tpl.body,
    placeholders: tpl.placeholders as readonly string[],
  }
}

export function recoveryPlanFor(path: RecoveryPath): RecoveryPlan {
  switch (path) {
    case 'broker':
      return BROKER_PLAN
    case 'carrier':
      return CARRIER_PLAN
    case 'ace-self-export':
      return ACE_PLAN
    case 'mixed':
      return MIXED_PLAN
  }
}

/**
 * Bridge to the schema-level RecoveryPath enum. The schema uses
 * snake_case (`ace_self_export`); the routing module follows ADR 015's
 * kebab-case (`ace-self-export`). Keep both honest with a typed map.
 */
export const SCHEMA_TO_RECOVERY_PATH: Readonly<Record<SchemaRecoveryPath, RecoveryPath>> = {
  broker: 'broker',
  carrier: 'carrier',
  ace_self_export: 'ace-self-export',
  mixed: 'mixed',
} as const
