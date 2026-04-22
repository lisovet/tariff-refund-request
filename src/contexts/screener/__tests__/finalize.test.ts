import { describe, expect, it, vi } from 'vitest'
import { finalizeScreener } from '../finalize'
import { createInMemoryScreenerRepo } from '../in-memory-repo'
import type { ScreenerAnswers } from '../types'

const happyAnswers: ScreenerAnswers = {
  q1: 'yes',
  q2: 'CN',
  q3: 'yes',
  q4: 'broker',
  q5: '50_500',
  q6: 'band_50k_500k',
  q7: { categories: ['consumer_electronics'] },
  q8: 'yes',
  q9: 'yes',
  q10: { company: 'Acme Imports', email: 'alex@acme.test' },
}

const dqAnswers: ScreenerAnswers = { q1: 'no' }

const SECRET = 'test-secret-32-chars-min-padding-1234'

type PublishArgs = Parameters<
  Parameters<typeof finalizeScreener>[1]['publishCompleted']
>

function makePublish() {
  return vi.fn<(...args: PublishArgs) => Promise<void>>(async () => {})
}

function deps(publish: ReturnType<typeof makePublish> = makePublish()) {
  return {
    repo: createInMemoryScreenerRepo(),
    publishCompleted: publish,
    secret: SECRET,
    resultsBaseUrl: 'https://app.example.test/screener/results',
  }
}

describe('finalizeScreener — happy path', () => {
  it('creates a session, writes a lead, signs a magic-link, publishes the completion event', async () => {
    const publish = makePublish()
    const d = deps(publish)
    const out = await finalizeScreener({ answers: happyAnswers }, d)

    expect(out.session.id).toMatch(/^sess_/)
    expect(out.session.completedAt).not.toBeNull()
    expect(out.lead).not.toBeNull()
    expect(out.lead?.email).toBe('alex@acme.test')
    expect(out.lead?.company).toBe('Acme Imports')
    expect(out.result.qualification).toBe('qualified')
    expect(out.magicLink).toMatch(/^https:\/\/app\.example\.test\/screener\/results\?token=/)

    // The publish callback fires with the same payload the workflow handler expects.
    expect(publish).toHaveBeenCalledTimes(1)
    const payload = publish.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      sessionId: out.session.id,
      email: 'alex@acme.test',
      company: 'Acme Imports',
      magicLink: out.magicLink,
    })

    // Lead is retrievable by email.
    const found = await d.repo.findLeadByEmail('alex@acme.test')
    expect(found?.id).toBe(out.lead?.id)
  })

  it('is REPLAY-safe: re-finalizing the same answers yields one lead row', async () => {
    const d = deps()
    const a = await finalizeScreener({ answers: happyAnswers }, d)
    const b = await finalizeScreener(
      { answers: happyAnswers, sessionId: a.session.id },
      d,
    )
    expect(a.lead).not.toBeNull()
    expect(b.lead?.id).toBe(a.lead?.id)
    expect(b.session.id).toBe(a.session.id)
  })
})

describe('finalizeScreener — disqualified path', () => {
  it('still writes a session but does NOT create a lead or publish (no email captured at q10)', async () => {
    const publish = makePublish()
    const d = deps(publish)
    const out = await finalizeScreener({ answers: dqAnswers }, d)
    expect(out.result.qualification).toBe('disqualified')
    expect(out.lead).toBeNull()
    expect(out.magicLink).toBeNull()
    expect(out.session.completedAt).not.toBeNull()
    expect(publish).not.toHaveBeenCalled()
  })
})

describe('finalizeScreener — input validation', () => {
  it('rejects when answers are not yet complete', async () => {
    const d = deps()
    await expect(
      finalizeScreener({ answers: { q1: 'yes', q2: 'CN' } }, d),
    ).rejects.toThrow(/incomplete/i)
  })
})
