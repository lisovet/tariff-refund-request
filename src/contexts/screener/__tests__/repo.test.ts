import { beforeEach, describe, expect, it } from 'vitest'
import { createInMemoryScreenerRepo } from '../in-memory-repo'
import type { ScreenerAnswers, ScreenerResult } from '../types'

const baseAnswers: ScreenerAnswers = {
  q1: 'yes',
  q2: 'CN',
  q3: 'yes',
}

const baseResult: ScreenerResult = {
  qualification: 'qualified',
  refundEstimate: { low: 18000, high: 180000, confidence: 'moderate', version: 'v1' },
  confidence: 'moderate',
  recoveryPath: 'broker',
  prerequisites: { ace: false, ach: false, ior: true, liquidationKnown: false },
  recommendedNextStep: 'recovery_service',
  version: 'screener-v1+estimator-v1',
}

describe('InMemoryScreenerRepo — sessions', () => {
  let repo: ReturnType<typeof createInMemoryScreenerRepo>
  beforeEach(() => {
    repo = createInMemoryScreenerRepo()
  })

  it('creates a session with a sess_-prefixed id', async () => {
    const session = await repo.createSession({ answers: baseAnswers })
    expect(session.id).toMatch(/^sess_/)
    expect(session.completedAt).toBeNull()
    expect(session.result).toBeNull()
  })

  it('updates answers without losing the original startedAt', async () => {
    const created = await repo.createSession({ answers: { q1: 'yes' } })
    const updated = await repo.updateAnswers(created.id, baseAnswers)
    expect(updated.answers).toEqual(baseAnswers)
    expect(updated.startedAt.getTime()).toBe(created.startedAt.getTime())
  })

  it('completeSession captures result + completedAt and freezes answers', async () => {
    const created = await repo.createSession({ answers: baseAnswers })
    const completed = await repo.completeSession(created.id, baseResult)
    expect(completed.completedAt).not.toBeNull()
    expect(completed.result).toEqual(baseResult)
    expect(completed.resultVersion).toBe(baseResult.version)
  })

  it('findById returns null when absent', async () => {
    expect(await repo.findSessionById('nope')).toBeNull()
  })
})

describe('InMemoryScreenerRepo — leads', () => {
  let repo: ReturnType<typeof createInMemoryScreenerRepo>
  beforeEach(() => {
    repo = createInMemoryScreenerRepo()
  })

  it('creates a lead with a lead_-prefixed id and links to a session', async () => {
    const session = await repo.createSession({ answers: baseAnswers })
    const lead = await repo.createLead({
      email: 'a@b.co',
      company: 'Acme',
      screenerSessionId: session.id,
      source: 'screener',
    })
    expect(lead.id).toMatch(/^lead_/)
    expect(lead.screenerSessionId).toBe(session.id)
    expect(lead.email).toBe('a@b.co')
  })

  it('createLead is idempotent on (email, screenerSessionId) — duplicate returns the existing row', async () => {
    const session = await repo.createSession({ answers: baseAnswers })
    const first = await repo.createLead({
      email: 'a@b.co',
      company: 'Acme',
      screenerSessionId: session.id,
      source: 'screener',
    })
    const second = await repo.createLead({
      email: 'a@b.co',
      company: 'Acme (different)',
      screenerSessionId: session.id,
      source: 'screener',
    })
    expect(second.id).toBe(first.id)
    // The latest write wins for company name (last-touched).
    expect(second.company).toBe('Acme (different)')
  })

  it('findLeadByEmail returns the most recent lead for an email', async () => {
    const s1 = await repo.createSession({ answers: baseAnswers })
    const s2 = await repo.createSession({ answers: baseAnswers })
    await repo.createLead({
      email: 'a@b.co',
      company: 'A',
      screenerSessionId: s1.id,
      source: 'screener',
    })
    const second = await repo.createLead({
      email: 'a@b.co',
      company: 'B',
      screenerSessionId: s2.id,
      source: 'screener',
    })
    const found = await repo.findLeadByEmail('a@b.co')
    expect(found?.id).toBe(second.id)
  })
})
