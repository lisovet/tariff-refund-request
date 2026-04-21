import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signToken, verifyToken } from '../magic-link'

const SECRET = 'test-secret-min-32-chars-please-1234'

describe('magic-link signToken / verifyToken', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('round-trips a token signed with the same secret', () => {
    const token = signToken(
      { sessionId: 'sess_x', email: 'a@b.co' },
      { secret: SECRET, ttlSeconds: 60 * 60 * 24 * 7 },
    )
    const verified = verifyToken(token, { secret: SECRET })
    expect(verified.ok).toBe(true)
    if (verified.ok) {
      expect(verified.payload.sessionId).toBe('sess_x')
      expect(verified.payload.email).toBe('a@b.co')
    }
  })

  it('rejects a token signed with a different secret', () => {
    const token = signToken(
      { sessionId: 'sess_x', email: 'a@b.co' },
      { secret: SECRET, ttlSeconds: 60 },
    )
    const verified = verifyToken(token, { secret: 'other-secret-1234567890123456789' })
    expect(verified.ok).toBe(false)
  })

  it('rejects a tampered payload', () => {
    const token = signToken(
      { sessionId: 'sess_x', email: 'a@b.co' },
      { secret: SECRET, ttlSeconds: 60 },
    )
    const [payload, sig] = token.split('.')
    if (!payload || !sig) throw new Error('bad token shape')
    // Tamper the payload portion.
    const tampered = `${payload}AA.${sig}`
    const verified = verifyToken(tampered, { secret: SECRET })
    expect(verified.ok).toBe(false)
  })

  it('rejects an expired token', () => {
    const token = signToken(
      { sessionId: 'sess_x', email: 'a@b.co' },
      { secret: SECRET, ttlSeconds: 60 },
    )
    vi.setSystemTime(new Date('2026-04-21T01:00:00Z')) // 1 hour later
    const verified = verifyToken(token, { secret: SECRET })
    expect(verified.ok).toBe(false)
    if (!verified.ok) {
      expect(verified.reason).toBe('expired')
    }
  })

  it('rejects a malformed token', () => {
    expect(verifyToken('not-a-token', { secret: SECRET }).ok).toBe(false)
    expect(verifyToken('a.b.c', { secret: SECRET }).ok).toBe(false)
    expect(verifyToken('', { secret: SECRET }).ok).toBe(false)
  })
})
