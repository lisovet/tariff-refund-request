import {
  type AppendAuditEntryInput,
  type AppendAuditEntryResult,
  type AuditEntry,
  type CaseRecord,
  type CaseRepo,
  type NewCaseInput,
  type RecordTransitionInput,
  type RecordTransitionResult,
} from './repo'

/**
 * In-memory CaseRepo. Mutates a Map keyed by caseId. The
 * `recordTransition` method writes both case state + audit row
 * synchronously, mimicking the Drizzle implementation's atomicity
 * promise (no risk of split state in this single-process store).
 */

let counter = 0
function caseId(): string {
  counter += 1
  return `cas_mem_${String(counter).padStart(6, '0')}`
}
function auditId(): string {
  counter += 1
  return `aud_mem_${String(counter).padStart(6, '0')}`
}

export function createInMemoryCaseRepo(): CaseRepo {
  const cases = new Map<string, CaseRecord>()
  const audit: AuditEntry[] = []

  return {
    async createCase(input: NewCaseInput): Promise<CaseRecord> {
      const now = new Date()
      const record: CaseRecord = {
        id: caseId(),
        state: 'new_lead',
        tier: input.tier,
        customerId: input.customerId ?? null,
        screenerSessionId: input.screenerSessionId ?? null,
        ownerStaffId: null,
        createdAt: now,
        updatedAt: now,
      }
      cases.set(record.id, record)
      return record
    },
    async findCase(id: string) {
      return cases.get(id)
    },
    async recordTransition(input: RecordTransitionInput): Promise<RecordTransitionResult> {
      const existing = cases.get(input.caseId)
      if (!existing) {
        throw new Error(`recordTransition: case ${input.caseId} not found`)
      }
      if (existing.state !== input.from) {
        // Optimistic concurrency: caller computed `from` from a stale
        // read. Treat as a hard error so retries don't cascade.
        throw new Error(
          `recordTransition: case ${input.caseId} drifted from ${input.from} to ${existing.state}`,
        )
      }
      cases.set(input.caseId, {
        ...existing,
        state: input.to,
        updatedAt: input.occurredAt,
      })
      const entry: AuditEntry = {
        id: auditId(),
        caseId: input.caseId,
        actorId: input.actorId,
        kind: input.event.type,
        fromState: input.from,
        toState: input.to,
        payload: stripActor(input.event),
        occurredAt: input.occurredAt,
      }
      audit.push(entry)
      return { auditId: entry.id }
    },
    async appendAuditEntry(input: AppendAuditEntryInput): Promise<AppendAuditEntryResult> {
      const entry: AuditEntry = {
        id: auditId(),
        caseId: input.caseId,
        actorId: input.actorId,
        kind: input.kind,
        fromState: null,
        toState: null,
        payload: input.payload,
        occurredAt: input.occurredAt,
      }
      audit.push(entry)
      return { auditId: entry.id }
    },
    async listAudit(caseId) {
      return audit
        .filter((a) => a.caseId === caseId)
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    },
    async listCasesByCustomer(customerId) {
      return Array.from(cases.values())
        .filter((c) => c.customerId === customerId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    },
    async deleteCaseAndAudit(caseIdValue) {
      const existed = cases.delete(caseIdValue)
      if (!existed) return { auditRowsRemoved: 0 }
      let removed = 0
      for (let i = audit.length - 1; i >= 0; i -= 1) {
        if (audit[i]?.caseId === caseIdValue) {
          audit.splice(i, 1)
          removed += 1
        }
      }
      return { auditRowsRemoved: removed }
    },
  }
}

function stripActor(event: { type: string } & Record<string, unknown>): Record<string, unknown> {
  const { type, actor: _actor, ...rest } = event
  return { type, ...rest }
}
