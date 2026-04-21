import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { auditLog, cases, type Schema } from '@shared/infra/db/schema'
import type { CaseEvent, CaseState } from './case-machine'
import {
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

    async listAudit(caseId: string): Promise<readonly AuditEntry[]> {
      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.caseId, caseId))
        .orderBy(asc(auditLog.occurredAt), desc(auditLog.id))
      return rows.map(mapAudit)
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
