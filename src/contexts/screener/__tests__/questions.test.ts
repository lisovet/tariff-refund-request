import { describe, expect, it } from 'vitest'
import { QUESTION_BY_ID } from '../questions'

describe('screener questions', () => {
  it('q1 headline names the IEEPA window; the dates live in the subtitle', () => {
    const q1 = QUESTION_BY_ID.q1
    expect(q1.prompt).toMatch(/IEEPA/)
    expect(q1.subtitle).toBeDefined()
    expect(q1.subtitle).toMatch(/February 4, 2025/)
    expect(q1.subtitle).toMatch(/February 23, 2026/)
  })
})
