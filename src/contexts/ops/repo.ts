import type { CaseEvent, CaseState } from './case-machine'

/**
 * CaseRepo — the persistence contract for the case service. Two
 * implementations: in-memory (tests, local dev w/o DB) and Drizzle
 * (real Postgres). Per PRD 04: every state transition must write
 * `cases.state` AND append an `audit_log` row in a single
 * transactional write.
 */

export interface CaseRecord {
  readonly id: string
  readonly state: CaseState
  readonly tier: 'smb' | 'mid_market'
  readonly customerId: string | null
  readonly screenerSessionId: string | null
  readonly ownerStaffId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface NewCaseInput {
  readonly tier: 'smb' | 'mid_market'
  readonly customerId?: string
  readonly screenerSessionId?: string
}

export interface RecordTransitionInput {
  readonly caseId: string
  readonly from: CaseState
  readonly to: CaseState
  readonly event: CaseEvent
  readonly actorId: string | null
  readonly occurredAt: Date
}

export interface RecordTransitionResult {
  readonly auditId: string
}

export interface AuditEntry {
  readonly id: string
  readonly caseId: string
  readonly actorId: string | null
  readonly kind: string
  readonly fromState: CaseState | null
  readonly toState: CaseState | null
  readonly payload: unknown
  readonly occurredAt: Date
}

export interface AppendAuditEntryInput {
  readonly caseId: string
  readonly kind: string
  readonly actorId: string | null
  readonly payload: unknown
  readonly occurredAt: Date
}

export interface AppendAuditEntryResult {
  readonly auditId: string
}

export interface CaseRepo {
  /** Insert a fresh case. Always starts in `new_lead`. */
  createCase(input: NewCaseInput): Promise<CaseRecord>
  findCase(caseId: string): Promise<CaseRecord | undefined>
  /**
   * Atomically advance `cases.state` and append the matching
   * `audit_log` row. Returns the new audit row's id. Implementations
   * MUST run both writes in a single transaction.
   */
  recordTransition(input: RecordTransitionInput): Promise<RecordTransitionResult>
  /**
   * Append a non-state-transition audit row (cadence fires, system
   * events, admin notes). fromState / toState are null on the
   * resulting row; `kind` carries the discriminator.
   */
  appendAuditEntry(input: AppendAuditEntryInput): Promise<AppendAuditEntryResult>
  /** Read-only audit history. Used by tests + the ops console. */
  listAudit(caseId: string): Promise<readonly AuditEntry[]>
}
