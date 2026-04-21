import type { Actor, StaffRole } from './actor'
import { isStaff } from './actor'

/**
 * Permission helper. Single chokepoint for authorization decisions.
 * Per ADR 001 + PRD 04: contexts call `can(actor, action)` rather than
 * branching on actor.kind themselves; route handlers AND background
 * workflows go through this same helper so policy stays consistent.
 *
 * Adding a new action: extend the Action union below + add the
 * matrix row. Tests in __tests__/can.test.ts cover the matrix.
 */

export type Action =
  // Public — no auth required.
  | 'screener.complete'
  // Customer surfaces.
  | 'case.read'
  | 'document.upload'
  | 'document.download.own'
  // Ops surfaces.
  | 'ops.queue.view'
  | 'ops.case.assign'
  | 'ops.case.transition'
  | 'entry.extract'
  | 'document.download.any'
  // QA — validator-gated per .claude/rules/human-qa-required.md.
  | 'qa.signoff'
  // Admin — admin-only.
  | 'admin.refund.issue'
  | 'admin.role.manage'
  | 'admin.audit.export'

const STAFF_MATRIX: Record<Action, readonly StaffRole[] | 'all-staff'> = {
  'screener.complete': 'all-staff',
  'case.read': 'all-staff',
  'document.upload': 'all-staff',
  'document.download.own': 'all-staff',

  'ops.queue.view': 'all-staff',
  'ops.case.assign': ['coordinator', 'admin'],
  'ops.case.transition': ['coordinator', 'analyst', 'validator', 'admin'],
  'entry.extract': ['analyst', 'admin'],
  'document.download.any': ['coordinator', 'analyst', 'validator', 'admin'],

  'qa.signoff': ['validator', 'admin'],

  'admin.refund.issue': ['admin'],
  'admin.role.manage': ['admin'],
  'admin.audit.export': ['admin'],
}

const CUSTOMER_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'screener.complete',
  'case.read',
  'document.upload',
  'document.download.own',
])

const ANONYMOUS_ACTIONS: ReadonlySet<Action> = new Set<Action>(['screener.complete'])

export function can(actor: Actor, action: Action): boolean {
  if (actor.kind === 'anonymous') return ANONYMOUS_ACTIONS.has(action)
  if (actor.kind === 'customer') return CUSTOMER_ACTIONS.has(action)
  if (isStaff(actor)) {
    const allowed = STAFF_MATRIX[action]
    if (allowed === 'all-staff') return true
    return allowed.includes(actor.role)
  }
  return false
}
