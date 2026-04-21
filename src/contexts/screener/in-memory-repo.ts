import { randomBytes } from 'node:crypto'
import type {
  CreateLeadInput,
  CreateSessionInput,
  LeadRecord,
  ScreenerRepo,
  ScreenerSessionRecord,
} from './repo'
import type { ScreenerAnswers, ScreenerResult } from './types'

/**
 * In-memory ScreenerRepo for tests + dev fallback. Mirrors the
 * Drizzle repo's semantics: createLead is idempotent on
 * (email, screenerSessionId) — duplicate calls return the existing
 * row updated with the latest company / source.
 */

const newId = (prefix: 'sess' | 'lead'): string => {
  const len = prefix === 'sess' ? 16 : 12
  return `${prefix}_${randomBytes(len).toString('hex')}`
}

export function createInMemoryScreenerRepo(): ScreenerRepo {
  const sessions = new Map<string, ScreenerSessionRecord>()
  // Keyed by `${email}::${sessionId ?? 'null'}` for idempotency lookup.
  const leadsByKey = new Map<string, LeadRecord>()

  function leadKey(email: string, sessionId: string | null): string {
    return `${email}::${sessionId ?? 'null'}`
  }

  return {
    async createSession(input: CreateSessionInput) {
      const now = new Date()
      const session: ScreenerSessionRecord = {
        id: newId('sess'),
        startedAt: now,
        completedAt: null,
        answers: { ...input.answers },
        result: null,
        resultVersion: null,
        createdAt: now,
        updatedAt: now,
      }
      sessions.set(session.id, session)
      return session
    },

    async updateAnswers(sessionId: string, answers: ScreenerAnswers) {
      const existing = sessions.get(sessionId)
      if (!existing) throw new Error(`session not found: ${sessionId}`)
      const updated: ScreenerSessionRecord = {
        ...existing,
        answers: { ...answers },
        updatedAt: new Date(),
      }
      sessions.set(sessionId, updated)
      return updated
    },

    async completeSession(sessionId: string, result: ScreenerResult) {
      const existing = sessions.get(sessionId)
      if (!existing) throw new Error(`session not found: ${sessionId}`)
      const now = new Date()
      const updated: ScreenerSessionRecord = {
        ...existing,
        completedAt: existing.completedAt ?? now,
        result,
        resultVersion: result.version,
        updatedAt: now,
      }
      sessions.set(sessionId, updated)
      return updated
    },

    async findSessionById(sessionId: string) {
      return sessions.get(sessionId) ?? null
    },

    async createLead(input: CreateLeadInput) {
      const key = leadKey(input.email, input.screenerSessionId)
      const existing = leadsByKey.get(key)
      if (existing) {
        const updated: LeadRecord = {
          ...existing,
          company: input.company,
          source: input.source,
          updatedAt: new Date(),
        }
        leadsByKey.set(key, updated)
        return updated
      }
      const now = new Date()
      const lead: LeadRecord = {
        id: newId('lead'),
        email: input.email,
        company: input.company,
        screenerSessionId: input.screenerSessionId,
        source: input.source,
        createdAt: now,
        updatedAt: now,
      }
      leadsByKey.set(key, lead)
      return lead
    },

    async findLeadByEmail(email: string) {
      // Most-recent wins.
      let latest: LeadRecord | null = null
      // Most-recent wins. Use >= so a later insertion at the same
      // millisecond supersedes an earlier one — matches the Drizzle
      // ORDER BY updated_at DESC semantics.
      for (const lead of leadsByKey.values()) {
        if (lead.email !== email) continue
        if (!latest || lead.updatedAt >= latest.updatedAt) latest = lead
      }
      return latest
    },
  }
}
