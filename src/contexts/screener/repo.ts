import type { ScreenerAnswers, ScreenerResult } from './types'

/**
 * Screener-context repos. Two implementations:
 *   - DrizzleScreenerRepo (production / DATABASE_URL set)
 *   - InMemoryScreenerRepo (tests + dev fallback)
 *
 * Per ADR 001: contexts depend on this contract — never on Drizzle
 * directly. Lets us test the magic-link flow (task #23) without a DB.
 */

export interface ScreenerSessionRecord {
  readonly id: string
  readonly startedAt: Date
  readonly completedAt: Date | null
  readonly answers: ScreenerAnswers
  readonly result: ScreenerResult | null
  readonly resultVersion: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface LeadRecord {
  readonly id: string
  readonly email: string
  readonly company: string | null
  readonly screenerSessionId: string | null
  readonly source: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateSessionInput {
  readonly answers: ScreenerAnswers
}

export interface CreateLeadInput {
  readonly email: string
  readonly company: string | null
  readonly screenerSessionId: string | null
  readonly source: string
}

export interface ScreenerRepo {
  createSession(input: CreateSessionInput): Promise<ScreenerSessionRecord>
  updateAnswers(
    sessionId: string,
    answers: ScreenerAnswers,
  ): Promise<ScreenerSessionRecord>
  completeSession(
    sessionId: string,
    result: ScreenerResult,
  ): Promise<ScreenerSessionRecord>
  findSessionById(sessionId: string): Promise<ScreenerSessionRecord | null>

  createLead(input: CreateLeadInput): Promise<LeadRecord>
  findLeadByEmail(email: string): Promise<LeadRecord | null>
}
