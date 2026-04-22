import { describe, expect, it } from 'vitest'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
  REFUND_TIMING_CLAUSE,
} from '../constants'

/**
 * Disclosure strings are a PRODUCT constant, not marketing copy per
 * `.claude/rules/disclosure-language-required.md`. These tests freeze
 * the wording so edits require intent.
 */

describe('CANONICAL_TRUST_PROMISE', () => {
  it('matches the verbatim-canonical string in the disclosure rule', () => {
    expect(CANONICAL_TRUST_PROMISE).toBe(
      'We help prepare your refund file. We do not guarantee CBP will approve it. We do not provide legal advice in this product. Every artifact you receive has been reviewed by a real person before it reaches you.',
    )
  })

  it('contains the four non-negotiable clauses', () => {
    expect(CANONICAL_TRUST_PROMISE).toMatch(/help prepare/)
    expect(CANONICAL_TRUST_PROMISE).toMatch(/do not guarantee/)
    expect(CANONICAL_TRUST_PROMISE).toMatch(/do not provide legal advice/)
    expect(CANONICAL_TRUST_PROMISE).toMatch(/reviewed by a real person/)
  })
})

describe('NOT_LEGAL_ADVICE_DISCLOSURE', () => {
  it('leads with the "Not legal advice" marker', () => {
    expect(NOT_LEGAL_ADVICE_DISCLOSURE.startsWith('Not legal advice.')).toBe(
      true,
    )
  })

  it('names CBP so readers see the outcome we cannot guarantee', () => {
    expect(NOT_LEGAL_ADVICE_DISCLOSURE).toMatch(
      /U\.S\. Customs and Border Protection/,
    )
  })

  it('does not carry the customs-broker carve-out (that lives in its own clause)', () => {
    expect(NOT_LEGAL_ADVICE_DISCLOSURE).not.toMatch(/customs broker/i)
    expect(NOT_LEGAL_ADVICE_DISCLOSURE).not.toMatch(/engagement letter/i)
  })
})

describe('NOT_A_CUSTOMS_BROKER_CLAUSE', () => {
  it('states the customs-broker scope and the engagement-letter carve-out', () => {
    expect(NOT_A_CUSTOMS_BROKER_CLAUSE).toMatch(/customs broker/i)
    expect(NOT_A_CUSTOMS_BROKER_CLAUSE).toMatch(/engagement letter/i)
  })
})

describe('SUBMISSION_CONTROL_CLAUSE', () => {
  it('preserves the "we prepare; you submit" formulation verbatim', () => {
    expect(SUBMISSION_CONTROL_CLAUSE).toBe(
      'We prepare files; you control submission.',
    )
  })
})

describe('REFUND_TIMING_CLAUSE', () => {
  it('disclaims timing dependency on CBP review', () => {
    expect(REFUND_TIMING_CLAUSE).toBe(
      'Refund timing depends on CBP review.',
    )
  })
})
