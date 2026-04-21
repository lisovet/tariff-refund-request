import type { ScreenerAnswers } from '@contexts/screener'
import type { DocumentKind, RecoveryPath as SchemaRecoveryPath } from '@shared/infra/db/schema'

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
  outreachTemplate: {
    subject: 'Request for IEEPA tariff entry summaries',
    body:
      'Hi {{brokerName}},\n\n' +
      'We are working with {{importerName}} on an IEEPA tariff refund. ' +
      'Could you send the entry summaries (CBP Form 7501) for every entry filed under their importer of record number ' +
      'between {{windowStart}} and {{windowEnd}}? Please include any associated broker spreadsheets or reconciliation ' +
      'reports you produced for that period.\n\n' +
      'If a CSV export is easier than individual 7501 PDFs, that works too — we accept .pdf, .xlsx, .csv, and forwarded .eml.\n\n' +
      'Thank you,\n{{importerName}}',
    placeholders: ['brokerName', 'importerName', 'windowStart', 'windowEnd'],
  },
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
  outreachTemplate: {
    subject: 'IEEPA duty invoices — historical entries',
    body:
      'Hi {{importerName}},\n\n' +
      'For the carrier path you log into the carrier portal (DHL MyDHL+, FedEx eCustoms, UPS Quantum View) and pull every duty invoice ' +
      'for entries between {{windowStart}} and {{windowEnd}}. Export each invoice as a PDF or CSV and upload them through the secure portal below.\n\n' +
      'If multiple carriers handled your shipments, repeat the process for each one. The accepted formats are .pdf, .xlsx, and .csv.\n\n' +
      'Need help with a specific carrier — reply to this email and an analyst will walk you through it.',
    placeholders: ['importerName', 'windowStart', 'windowEnd'],
  },
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
  outreachTemplate: {
    subject: 'ACE entry export walkthrough',
    body:
      'Hi {{importerName}},\n\n' +
      'You have an ACE account, which is the cleanest path. Sign in at https://ace.cbp.dhs.gov, run the Entry Summary report ' +
      'for the date range {{windowStart}} to {{windowEnd}}, export as CSV, and upload it through the secure portal below.\n\n' +
      'Step-by-step screenshots are linked from the workspace. If you would prefer, an analyst can join a 30-minute screen-share ' +
      'and walk through the export with you — just reply to this email.',
    placeholders: ['importerName', 'windowStart', 'windowEnd'],
  },
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
  outreachTemplate: {
    subject: 'IEEPA tariff entry collection — mixed clearance',
    body:
      'Hi {{importerName}},\n\n' +
      'Because your shipments cleared through more than one path (broker + carrier or ACE + broker), we will collect entries ' +
      'from each path you used. The workspace lets you upload documents from any source — broker 7501s, carrier invoices, and ACE exports ' +
      'are all accepted in the same case.\n\n' +
      'An analyst will reconcile the entries across sources and flag any duplicates before the entry list is finalized.',
    placeholders: ['importerName', 'windowStart', 'windowEnd'],
  },
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
