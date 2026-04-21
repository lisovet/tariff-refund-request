import 'server-only'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { auditLog, cases, type Schema } from '@shared/infra/db/schema'
import type { CaseEvent, CaseState } from './case-machine'
import {
  type AppendAuditEntryInput,
  type AppendAuditEntryResult,
  type AuditEntry,
  type CaseRecord,
  type CaseRepo,
  type NewCaseInput,
  type RecordTransitionInput,
} from './repo'

/**
 * Drizzle-backed CaseRepo. The transactional contract from the
 * interface — case.state UPDATE + audit_log INSERT — is implemented
 * via `db.transaction(async (tx) => …)`. Either both writes commit
 * or neither does.
 *
 * Optimistic concurrency: the UPDATE includes `WHERE state = $from`
 * so a stale read by the caller fails the row count check and we
 * roll back with a clear error.
 */

export function createDrizzleCaseRepo(
  db: PostgresJsDatabase<Schema>,
): CaseRepo {
  return {
    async createCase(input: NewCaseInput): Promise<CaseRecord> {
      const inserted = await db
        .insert(cases)
        .values({
          tier: input.tier,
          customerId: input.customerId ?? null,
          screenerSessionId: input.screenerSessionId ?? null,
        })
        .returning()
      const row = inserted[0]
      if (!row) throw new Error('createCase: insert returned no rows')
      return mapCase(row)
    },

    async findCase(caseId: string) {
      const rows = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1)
      const row = rows[0]
      return row ? mapCase(row) : undefined
    },

    async recordTransition(input: RecordTransitionInput) {
      return db.transaction(async (tx) => {
        const updated = await tx
          .update(cases)
          .set({ state: input.to, updatedAt: input.occurredAt })
          .where(and(eq(cases.id, input.caseId), eq(cases.state, input.from)))
          .returning({ id: cases.id })
        if (updated.length === 0) {
          // Concurrency: another writer changed state from underneath
          // us, or the case is gone. Either way we cannot append the
          // audit row honestly, so we fail the whole transaction.
          throw new Error(
            `recordTransition: case ${input.caseId} drifted from ${input.from} (no rows updated)`,
          )
        }
        const auditRows = await tx
          .insert(auditLog)
          .values({
            caseId: input.caseId,
            actorId: input.actorId,
            kind: input.event.type,
            fromState: input.from,
            toState: input.to,
            payload: stripActor(input.event),
            occurredAt: input.occurredAt,
          })
          .returning({ id: auditLog.id })
        const auditRow = auditRows[0]
        if (!auditRow) throw new Error('recordTransition: audit insert returned no rows')
        return { auditId: auditRow.id }
      })
    },

    async appendAuditEntry(input: AppendAuditEntryInput): Promise<AppendAuditEntryResult> {
      const inserted = await db
        .insert(auditLog)
        .values({
          caseId: input.caseId,
          actorId: input.actorId,
          kind: input.kind,
          fromState: null,
          toState: null,
          payload: input.payload as Record<string, unknown>,
          occurredAt: input.occurredAt,
        })
        .returning({ id: auditLog.id })
      const row = inserted[0]
      if (!row) throw new Error('appendAuditEntry: insert returned no rows')
      return { auditId: row.id }
    },

    async listAudit(caseId: string): Promise<readonly AuditEntry[]> {
      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.caseId, caseId))
        .orderBy(asc(auditLog.occurredAt), desc(auditLog.id))
      return rows.map(mapAudit)
    },

    async listCasesByCustomer(customerId: string): Promise<readonly CaseRecord[]> {
      const rows = await db
        .select()
        .from(cases)
        .where(eq(cases.customerId, customerId))
        .orderBy(asc(cases.createdAt))
      return rows.map(mapCase)
    },

    async deleteCaseAndAudit(
      caseIdValue: string,
    ): Promise<{ auditRowsRemoved: number }> {
      return db.transaction(async (tx) => {
        const removedAudit = await tx
          .delete(auditLog)
          .where(eq(auditLog.caseId, caseIdValue))
          .returning({ id: auditLog.id })
        const removedCase = await tx
          .delete(cases)
          .where(eq(cases.id, caseIdValue))
          .returning({ id: cases.id })
        if (removedCase.length === 0) {
          return { auditRowsRemoved: 0 }
        }
        return { auditRowsRemoved: removedAudit.length }
      })
    },

    async listCases(input?: { readonly limit?: number; readonly offset?: number }) {
      const q = db
        .select()
        .from(cases)
        .orderBy(desc(cases.updatedAt))
      const limit = input?.limit
      const offset = input?.offset
      if (limit !== undefined && offset !== undefined) {
        const rows = await q.limit(limit).offset(offset)
        return rows.map(mapCase)
      }
      if (limit !== undefined) {
        const rows = await q.limit(limit)
        return rows.map(mapCase)
      }
      const rows = await q
      return rows.map(mapCase)
    },

    async casSetOwner(input: {
      readonly caseId: string
      readonly expectedOwnerStaffId: string | null
      readonly nextOwnerStaffId: string | null
      readonly occurredAt: Date
    }): Promise<CaseRecord | undefined> {
      // Optimistic concurrency: the WHERE clause pins the current
      // owner. When two actors race, the second UPDATE matches zero
      // rows; returning() is empty; the service treats the empty
      // result as a CAS miss.
      const expected = input.expectedOwnerStaffId
      const whereOwner =
        expected === null
          ? and(eq(cases.id, input.caseId), isNull(cases.ownerStaffId))
          : and(eq(cases.id, input.caseId), eq(cases.ownerStaffId, expected))
      const rows = (await db
        .update(cases)
        .set({
          ownerStaffId: input.nextOwnerStaffId,
          updatedAt: input.occurredAt,
        })
        .where(whereOwner)
        .returning()) as CaseRow[]
      return rows[0] ? mapCase(rows[0]) : undefined
    },
  }
}

type CaseRow = typeof cases.$inferSelect
type AuditRow = typeof auditLog.$inferSelect

function mapCase(row: CaseRow): CaseRecord {
  return {
    id: row.id,
    state: row.state as CaseState,
    tier: row.tier,
    customerId: row.customerId,
    screenerSessionId: row.screenerSessionId,
    ownerStaffId: row.ownerStaffId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapAudit(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    caseId: row.caseId,
    actorId: row.actorId,
    kind: row.kind,
    fromState: row.fromState as CaseState | null,
    toState: row.toState as CaseState | null,
    payload: row.payload,
    occurredAt: row.occurredAt,
  }
}

function stripActor(event: CaseEvent): Record<string, unknown> {
  const { type, ...rest } = event as { type: string } & Record<string, unknown>
  delete (rest as { actor?: unknown }).actor
  return { type, ...rest }
}
