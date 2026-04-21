import { desc, eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import {
  leads,
  screenerSessions,
  type LeadRow,
  type Schema,
  type ScreenerSessionRow,
} from '@shared/infra/db/schema'
import type {
  CreateLeadInput,
  CreateSessionInput,
  LeadRecord,
  ScreenerRepo,
  ScreenerSessionRecord,
} from './repo'
import type { ScreenerAnswers, ScreenerResult } from './types'

type Db = PostgresJsDatabase<Schema>

function toSession(row: ScreenerSessionRow): ScreenerSessionRecord {
  return {
    id: row.id,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    answers: row.answers as ScreenerAnswers,
    result: row.result as ScreenerResult | null,
    resultVersion: row.resultVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    email: row.email,
    company: row.company,
    screenerSessionId: row.screenerSessionId,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createDrizzleScreenerRepo(db: Db): ScreenerRepo {
  return {
    async createSession(input: CreateSessionInput) {
      const rows = await db
        .insert(screenerSessions)
        .values({ answers: input.answers })
        .returning()
      return toSession(rows[0] as ScreenerSessionRow)
    },

    async updateAnswers(sessionId, answers) {
      const rows = await db
        .update(screenerSessions)
        .set({ answers, updatedAt: sql`NOW()` })
        .where(eq(screenerSessions.id, sessionId))
        .returning()
      const row = rows[0]
      if (!row) throw new Error(`session not found: ${sessionId}`)
      return toSession(row as ScreenerSessionRow)
    },

    async completeSession(sessionId, result: ScreenerResult) {
      const rows = await db
        .update(screenerSessions)
        .set({
          result,
          resultVersion: result.version,
          completedAt: sql`COALESCE(${screenerSessions.completedAt}, NOW())`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(screenerSessions.id, sessionId))
        .returning()
      const row = rows[0]
      if (!row) throw new Error(`session not found: ${sessionId}`)
      return toSession(row as ScreenerSessionRow)
    },

    async findSessionById(sessionId) {
      const rows = (await db
        .select()
        .from(screenerSessions)
        .where(eq(screenerSessions.id, sessionId))
        .limit(1)) as ScreenerSessionRow[]
      return rows[0] ? toSession(rows[0]) : null
    },

    async createLead(input: CreateLeadInput) {
      const rows = await db
        .insert(leads)
        .values({
          email: input.email,
          company: input.company,
          screenerSessionId: input.screenerSessionId,
          source: input.source,
        })
        .onConflictDoUpdate({
          target: [leads.email, leads.screenerSessionId],
          set: {
            company: input.company,
            source: input.source,
            updatedAt: sql`NOW()`,
          },
        })
        .returning()
      return toLead(rows[0] as LeadRow)
    },

    async findLeadByEmail(email) {
      const rows = (await db
        .select()
        .from(leads)
        .where(eq(leads.email, email))
        .orderBy(desc(leads.updatedAt))
        .limit(1)) as LeadRow[]
      return rows[0] ? toLead(rows[0]) : null
    },
  }
}
