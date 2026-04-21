import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { auditLog, cases, schema } from '../schema'

const DRIZZLE_DIR = join(process.cwd(), 'drizzle')

describe('cases + audit_log Drizzle schema (task #39)', () => {
  it('registers cases + audit_log on the global schema', () => {
    expect(schema.tables).toHaveProperty('cases')
    expect(schema.tables).toHaveProperty('auditLog')
  })

  it('cases has the v1 columns the case-machine needs', () => {
    const cols = cases as unknown as Record<string, unknown>
    for (const col of [
      'id',
      'customerId',
      'screenerSessionId',
      'state',
      'tier',
      'ownerStaffId',
      'createdAt',
      'updatedAt',
    ]) {
      expect(cols).toHaveProperty(col)
    }
  })

  it('cases.state is a typed enum matching the PRD 04 case-machine states', () => {
    const stateCol = (cases as unknown as {
      state: { enumValues?: readonly string[] }
    }).state
    // The full v1 state set per PRD 04.
    expect(stateCol.enumValues).toEqual(
      expect.arrayContaining([
        'new_lead',
        'qualified',
        'disqualified',
        'awaiting_purchase',
        'awaiting_docs',
        'entry_recovery_in_progress',
        'entry_list_ready',
        'awaiting_prep_purchase',
        'cape_prep_in_progress',
        'batch_qa',
        'submission_ready',
        'concierge_active',
        'filed',
        'pending_cbp',
        'deficient',
        'paid',
        'stalled',
        'closed',
      ]),
    )
  })

  it('audit_log columns include caseId, actorId, kind, fromState, toState, payload, occurredAt', () => {
    const cols = auditLog as unknown as Record<string, unknown>
    for (const col of [
      'id',
      'caseId',
      'actorId',
      'kind',
      'fromState',
      'toState',
      'payload',
      'occurredAt',
    ]) {
      expect(cols).toHaveProperty(col)
    }
  })
})

describe('cases + audit_log migration', () => {
  function loadCasesMigration(): string {
    const files = readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith('.sql'))
    const match = files.find((f) => /cases|audit/i.test(f))
    if (!match) {
      throw new Error(
        `no cases/audit migration found in drizzle/. Files: ${files.join(', ')}`,
      )
    }
    return readFileSync(join(DRIZZLE_DIR, match), 'utf8')
  }

  it('creates the cases table', () => {
    const sql = loadCasesMigration()
    expect(sql).toMatch(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?cases"?/i)
  })

  it('creates the audit_log table', () => {
    const sql = loadCasesMigration()
    expect(sql).toMatch(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?audit_log"?/i)
  })

  it('enables row-level security on audit_log', () => {
    const sql = loadCasesMigration()
    expect(sql).toMatch(/ALTER TABLE\s+"?audit_log"?\s+ENABLE ROW LEVEL SECURITY/i)
  })

  it('installs an RLS policy that denies DELETE on audit_log for all roles', () => {
    const sql = loadCasesMigration()
    // We deny DELETE by creating a policy that matches no rows (USING false).
    // Acceptance from task #39: "attempted DELETE on audit_log fails."
    expect(sql).toMatch(
      /CREATE POLICY[^\n]+ON\s+"?audit_log"?[\s\S]+FOR DELETE[\s\S]+USING\s*\(\s*false\s*\)/i,
    )
  })
})
