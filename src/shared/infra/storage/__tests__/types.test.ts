import { describe, expect, it } from 'vitest'
import { caseScopedKey, isStorageKey } from '../types'

/**
 * Storage key contract tests.
 * Per ADR 006: document keys are case-scoped: cases/{caseId}/{documentId}/{filename}.
 */

describe('storage key contract', () => {
  it('builds a case-scoped key with the canonical layout', () => {
    const key = caseScopedKey({
      caseId: 'case_2026_0001',
      documentId: 'doc_abc',
      filename: 'entry-summary.pdf',
    })
    expect(key).toBe('cases/case_2026_0001/doc_abc/entry-summary.pdf')
  })

  it('rejects empty segments', () => {
    expect(() =>
      caseScopedKey({ caseId: '', documentId: 'd', filename: 'f' }),
    ).toThrow(/caseId/)
    expect(() =>
      caseScopedKey({ caseId: 'c', documentId: '', filename: 'f' }),
    ).toThrow(/documentId/)
    expect(() =>
      caseScopedKey({ caseId: 'c', documentId: 'd', filename: '' }),
    ).toThrow(/filename/)
  })

  it('rejects path-traversal attempts in any segment', () => {
    expect(() =>
      caseScopedKey({ caseId: '../etc', documentId: 'd', filename: 'f' }),
    ).toThrow(/invalid/i)
    expect(() =>
      caseScopedKey({ caseId: 'c', documentId: 'd/../e', filename: 'f' }),
    ).toThrow(/invalid/i)
    expect(() =>
      caseScopedKey({ caseId: 'c', documentId: 'd', filename: '../f' }),
    ).toThrow(/invalid/i)
  })

  it('isStorageKey accepts canonical case-scoped keys', () => {
    expect(isStorageKey('cases/case_x/doc_y/file.pdf')).toBe(true)
  })

  it('isStorageKey rejects non-case-scoped strings', () => {
    expect(isStorageKey('arbitrary/path')).toBe(false)
    expect(isStorageKey('')).toBe(false)
    expect(isStorageKey('cases/')).toBe(false)
  })
})
