import { describe, expect, it } from 'vitest'
import {
  CANONICAL_ENTRY_NUMBER_RE,
  canonicalizeEntryNumber,
  formatCanonicalEntryNumber,
  type CanonicalEntryNumberResult,
} from '../canonicalize'

/**
 * CBP 7501 entry numbers are filer-code (3 alphanumeric) + sequence
 * (7 digits) + check digit (1 digit). Commonly written with dashes:
 *
 *     ABC-1234567-8
 *
 * The canonicalizer accepts variants (no dashes, mixed case,
 * whitespace, smart punctuation) and returns the dashed canonical
 * form, or surfaces a validation failure with a specific reason.
 */

function ok(result: CanonicalEntryNumberResult): result is Extract<CanonicalEntryNumberResult, { ok: true }> {
  return result.ok === true
}

describe('canonicalizeEntryNumber — happy cases', () => {
  it.each([
    ['ABC-1234567-8', 'ABC-1234567-8'],
    ['abc-1234567-8', 'ABC-1234567-8'],
    ['ABC12345678', 'ABC-1234567-8'],
    ['  ABC-1234567-8  ', 'ABC-1234567-8'],
    ['ABC 1234567 8', 'ABC-1234567-8'],
    ['ABC—1234567—8', 'ABC-1234567-8'], // em dashes
    ['ABC–1234567–8', 'ABC-1234567-8'], // en dashes
  ])('canonicalizes %j → %j', (input, expected) => {
    const result = canonicalizeEntryNumber(input)
    expect(result.ok).toBe(true)
    if (ok(result)) expect(result.canonical).toBe(expected)
  })

  it('preserves the raw input so analyst review can see what was entered', () => {
    const raw = '  abc-1234567-8  '
    const result = canonicalizeEntryNumber(raw)
    if (!ok(result)) throw new Error('unreachable')
    expect(result.raw).toBe(raw)
  })

  it('canonical output always matches the CANONICAL_ENTRY_NUMBER_RE', () => {
    const result = canonicalizeEntryNumber('abc-1234567-8')
    if (!ok(result)) throw new Error('unreachable')
    expect(CANONICAL_ENTRY_NUMBER_RE.test(result.canonical)).toBe(true)
  })
})

describe('canonicalizeEntryNumber — rejections', () => {
  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['ABC-1234567', 'length'], // missing check digit
    ['ABC-12345678', 'length'], // 12 chars, wrong split
    ['ABC-12345', 'length'],
    ['ABC12345', 'length'],
    ['12345678901234', 'length'], // too long
    ['AB-1234567-8', 'filer_code_invalid'], // 2-char filer
    ['A!C-1234567-8', 'filer_code_invalid'], // special char in filer
    ['ABC-123456X-8', 'sequence_not_digits'],
    ['ABC-1234567-X', 'check_digit_not_digit'],
    ['ABC12345678X', 'length'], // 12 chars; last X ≠ digit is caught by length now
  ])('rejects %j → reason %s', (input, reason) => {
    const result = canonicalizeEntryNumber(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe(reason)
  })
})

describe('formatCanonicalEntryNumber', () => {
  it('produces a stable display form for a canonical number', () => {
    expect(formatCanonicalEntryNumber('ABC-1234567-8')).toBe('ABC-1234567-8')
  })

  it('throws on a non-canonical input (caller did not canonicalize first)', () => {
    expect(() => formatCanonicalEntryNumber('abc12345678')).toThrow(
      /non-canonical/i,
    )
  })
})

describe('CANONICAL_ENTRY_NUMBER_RE', () => {
  it('matches only the dashed 3-7-1 uppercase shape', () => {
    expect(CANONICAL_ENTRY_NUMBER_RE.test('ABC-1234567-8')).toBe(true)
    expect(CANONICAL_ENTRY_NUMBER_RE.test('abc-1234567-8')).toBe(false)
    expect(CANONICAL_ENTRY_NUMBER_RE.test('ABC12345678')).toBe(false)
    expect(CANONICAL_ENTRY_NUMBER_RE.test('ABCD-123456-8')).toBe(false)
  })
})
