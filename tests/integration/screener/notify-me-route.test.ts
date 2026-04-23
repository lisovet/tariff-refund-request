import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { createInMemoryScreenerRepo } from '@contexts/screener/server'
import type { ScreenerAnswers, ScreenerResult } from '@contexts/screener'

/**
 * Integration test for POST /api/screener/notify-me. Uses the
 * in-memory screener repo so the route contract (validation, guards,
 * persistence) is exercised end-to-end without a live database.
 */

const mocks = vi.hoisted(() => ({
  repo: undefined as ReturnType<typeof createInMemoryScreenerRepo> | undefined,
}))

vi.mock('@contexts/screener/server', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>
  return {
    ...actual,
    getScreenerRepo: () => mocks.repo,
  }
})

import { POST } from '@/app/api/screener/notify-me/route'

function jsonReq(body: unknown): Request {
  return new Request('https://example.com/api/screener/notify-me', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const DQ_ANSWERS: ScreenerAnswers = { q1: 'no' }
const DQ_RESULT: ScreenerResult = {
  qualification: 'disqualified',
  refundEstimate: null,
  confidence: 'low',
  recoveryPath: null,
  prerequisites: { ace: false, ach: false, ior: false, liquidationKnown: false },
  recommendedNextStep: 'none',
  disqualificationReason: 'no_imports_in_window',
  version: 'screener-v1+estimator-v1',
}

const QUAL_RESULT: ScreenerResult = {
  qualification: 'qualified',
  refundEstimate: { low: 1000, high: 2000, confidence: 'high', version: 'v1' },
  confidence: 'high',
  recoveryPath: 'broker',
  prerequisites: { ace: true, ach: true, ior: true, liquidationKnown: true },
  recommendedNextStep: 'full_prep',
  version: 'screener-v1+estimator-v1',
}

let dqSessionId: string

beforeEach(async () => {
  const { createInMemoryScreenerRepo } = await import('@contexts/screener/server')
  mocks.repo = createInMemoryScreenerRepo()
  const s = await mocks.repo.createSession({ answers: DQ_ANSWERS })
  await mocks.repo.completeSession(s.id, DQ_RESULT)
  dqSessionId = s.id
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/screener/notify-me', () => {
  it('400s on an invalid body', async () => {
    const res = await POST(jsonReq({ email: 'foo' }))
    expect(res.status).toBe(400)
  })

  it('400s when consent is not true', async () => {
    const res = await POST(
      jsonReq({ sessionId: dqSessionId, email: 'a@b.co', consent: false }),
    )
    expect(res.status).toBe(400)
  })

  it('404s when the session does not exist', async () => {
    const res = await POST(
      jsonReq({ sessionId: 'sess_missing', email: 'a@b.co', consent: true }),
    )
    expect(res.status).toBe(404)
  })

  it('400s when the session is not disqualified', async () => {
    const q = await mocks.repo!.createSession({ answers: { q1: 'yes' } as ScreenerAnswers })
    await mocks.repo!.completeSession(q.id, QUAL_RESULT)
    const res = await POST(
      jsonReq({ sessionId: q.id, email: 'a@b.co', consent: true }),
    )
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('session_not_disqualified')
  })

  it('creates a lead row with source=disqualified_notify on success', async () => {
    const res = await POST(
      jsonReq({ sessionId: dqSessionId, email: 'Opt-In@Example.com', consent: true }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: boolean }
    expect(json.ok).toBe(true)

    const lead = await mocks.repo!.findLeadByEmail('opt-in@example.com')
    expect(lead).not.toBeNull()
    expect(lead?.source).toBe('disqualified_notify')
    expect(lead?.screenerSessionId).toBe(dqSessionId)
    expect(lead?.company).toBeNull()
  })

  it('is idempotent on repeat submission (same email + session)', async () => {
    const body = { sessionId: dqSessionId, email: 'dup@example.com', consent: true }
    const first = await POST(jsonReq(body))
    expect(first.status).toBe(200)
    const second = await POST(jsonReq(body))
    // Either 200 with ok:true (idempotent upsert) or 500 if the repo
    // bubbles a unique-constraint error — route MUST handle it as
    // success to avoid scaring the user on a harmless re-submit.
    expect([200]).toContain(second.status)
  })
})
