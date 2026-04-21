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
  /**
   * List every case tied to a customer. Used by the data-rights
   * (export + deletion) workflows per PRD 10. Returns in
   * chronological order of creation.
   */
  listCasesByCustomer(customerId: string): Promise<readonly CaseRecord[]>
  /**
   * Hard-delete a case, its audit-log rows, and any satellite
   * records owned by it. Used only by the deletion worker. The
   * worker is responsible for writing a separate, content-free
   * audit row elsewhere (typically on a global "deletion log")
   * BEFORE calling this.
   */
  deleteCaseAndAudit(caseId: string): Promise<{ auditRowsRemoved: number }>
  /**
   * Ops-console queue read. Passthrough filter shape lives in
   * `@contexts/ops/queue`; the repo kept standalone to avoid a
   * structural import cycle — callers apply the pure filter after
   * fetching the raw cases.
   */
  listCases(input?: {
    readonly limit?: number
    readonly offset?: number
  }): Promise<readonly CaseRecord[]>

  /**
   * Optimistic-concurrency ownership change. Compares-and-swaps on
   * `ownerStaffId`: the write succeeds only when the repo's
   * observed current owner matches `expectedOwnerStaffId`. Returns
   * the updated record on success, or `undefined` when the CAS
   * failed (another actor won the race OR the case is gone).
   *
   * Used by the claim / release / reassign service
   * (`src/contexts/ops/assignment.ts`) to avoid two analysts
   * claiming the same case simultaneously.
   */
  casSetOwner(input: {
    readonly caseId: string
    readonly expectedOwnerStaffId: string | null
    readonly nextOwnerStaffId: string | null
    readonly occurredAt: Date
  }): Promise<CaseRecord | undefined>
}
