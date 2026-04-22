import { describe, expect, it } from 'vitest'
import { QUESTION_BY_ID } from '../questions'

describe('screener questions', () => {
  it('q1 prompt names both IEEPA window dates inline', () => {
    const prompt = QUESTION_BY_ID.q1.prompt
    expect(prompt).toMatch(/February 4, 2025/)
    expect(prompt).toMatch(/February 23, 2026/)
    expect(prompt).toMatch(/IEEPA/)
  })
})
