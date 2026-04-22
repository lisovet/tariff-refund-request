import { describe, expect, it } from 'vitest'
import { nextQuestion, isComplete } from '../branching'
import type { ScreenerAnswers } from '../types'

/**
 * Branching engine tests. Per PRD 01: one question at a time, branching
 * is invisible to the user. The 10-question flow has these structural
 * branches:
 *
 *   Q1 = "no" → DQ-1 (disqualified, terminal)
 *   Q3 = "no" → DQ-2 (not IOR, terminal)
 *   Otherwise advance through Q1..Q10 in order, then complete.
 *
 * Test names use the canonical `q1`..`q10` ids defined in questions.ts.
 */

const blank: ScreenerAnswers = {}

describe('nextQuestion', () => {
  it('returns q1 when no answers exist', () => {
    expect(nextQuestion(blank)?.id).toBe('q1')
  })

  it('advances q1 → q2 when q1 = yes', () => {
    expect(nextQuestion({ q1: 'yes' })?.id).toBe('q2')
  })

  it('returns null after q1 = no (terminal disqualification)', () => {
    expect(nextQuestion({ q1: 'no' })).toBeNull()
  })

  it('advances q2 → q3 with any country answer', () => {
    expect(nextQuestion({ q1: 'yes', q2: 'CN' })?.id).toBe('q3')
  })

  it('advances q2 → q3 even when country is "unknown"', () => {
    expect(nextQuestion({ q1: 'yes', q2: 'unknown' })?.id).toBe('q3')
  })

  it('returns null after q3 = no (not IOR — terminal)', () => {
    expect(
      nextQuestion({ q1: 'yes', q2: 'CN', q3: 'no' }),
    ).toBeNull()
  })

  it('advances q3 → q4 when q3 = yes', () => {
    expect(
      nextQuestion({ q1: 'yes', q2: 'CN', q3: 'yes' })?.id,
    ).toBe('q4')
  })

  it('advances q4..q9 in order', () => {
    const partial: ScreenerAnswers = {
      q1: 'yes',
      q2: 'CN',
      q3: 'yes',
      q4: 'broker',
      q5: '50_500',
      q6: 'band_50k_500k',
      q7: { categories: ['consumer_electronics'] },
      q8: 'yes',
    }
    expect(nextQuestion(partial)?.id).toBe('q9')
  })

  it('asks q10 (email capture) after q9', () => {
    const partial: ScreenerAnswers = {
      q1: 'yes',
      q2: 'CN',
      q3: 'yes',
      q4: 'broker',
      q5: '50_500',
      q6: 'band_50k_500k',
      q7: { categories: ['consumer_electronics'] },
      q8: 'yes',
      q9: 'yes',
    }
    expect(nextQuestion(partial)?.id).toBe('q10')
  })

  it('returns null when all 10 questions are answered', () => {
    const all: ScreenerAnswers = {
      q1: 'yes',
      q2: 'CN',
      q3: 'yes',
      q4: 'broker',
      q5: '50_500',
      q6: 'band_50k_500k',
      q7: { categories: ['consumer_electronics'] },
      q8: 'yes',
      q9: 'yes',
      q10: { company: 'Acme Imports', email: 'a@b.co' },
    }
    expect(nextQuestion(all)).toBeNull()
  })
})

describe('isComplete', () => {
  it('is true when q1 = no (DQ early)', () => {
    expect(isComplete({ q1: 'no' })).toBe(true)
  })

  it('is true when q3 = no (DQ early)', () => {
    expect(isComplete({ q1: 'yes', q2: 'CN', q3: 'no' })).toBe(true)
  })

  it('is true when q10 captured', () => {
    expect(
      isComplete({
        q1: 'yes',
        q2: 'CN',
        q3: 'yes',
        q4: 'broker',
        q5: '50_500',
        q6: 'band_50k_500k',
        q7: { categories: ['consumer_electronics'] },
        q8: 'yes',
        q9: 'yes',
        q10: { company: 'Acme', email: 'a@b.co' },
      }),
    ).toBe(true)
  })

  it('is false mid-screener', () => {
    expect(isComplete({ q1: 'yes', q2: 'CN', q3: 'yes' })).toBe(false)
  })

  it('is false on empty answers', () => {
    expect(isComplete(blank)).toBe(false)
  })
})
