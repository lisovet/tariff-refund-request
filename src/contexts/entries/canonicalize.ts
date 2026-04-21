/**
 * Entry-number canonicalization per PRD 07.
 *
 * CBP 7501 entry numbers follow a strict format:
 *
 *     FFF-SSSSSSS-C
 *
 * where:
 *     FFF     3-character alphanumeric filer code
 *     SSSSSSS 7-digit sequence
 *     C       1-digit check digit
 *
 * Canonicalizer accepts:
 *     - dashed or undashed forms
 *     - leading/trailing whitespace
 *     - spaces between segments
 *     - en/em dashes (customers copy-paste from Excel / Word)
 *     - mixed case
 *
 * Canonical output: uppercase `FFF-SSSSSSS-C`. Check-digit
 * mathematical validation is deferred to a Phase-2 ingest pass;
 * v1 validates shape only.
 */

export const CANONICAL_ENTRY_NUMBER_RE = /^[A-Z0-9]{3}-\d{7}-\d$/

export type CanonicalEntryNumberResult =
  | { readonly ok: true; readonly canonical: string; readonly raw: string }
  | {
      readonly ok: false
      readonly reason:
        | 'empty'
        | 'length'
        | 'filer_code_invalid'
        | 'sequence_not_digits'
        | 'check_digit_not_digit'
      readonly raw: string
    }

export function canonicalizeEntryNumber(raw: string): CanonicalEntryNumberResult {
  if (raw.trim().length === 0) return { ok: false, reason: 'empty', raw }

  // Normalize dash variants + collapse whitespace to hyphens, but
  // keep the dash-shape signal BEFORE dropping non-alphanumerics so
  // a malformed filer surfaces as filer_code_invalid rather than a
  // generic length error.
  const dashNormalized = raw
    .trim()
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, '-')

  const rawSegments = dashNormalized.split('-').filter((s) => s.length > 0)
  const userSuppliedDashes = rawSegments.length === 3

  const stripped = dashNormalized.replace(/[^A-Za-z0-9-]/g, '')
  const segments = stripped.split('-').filter((s) => s.length > 0)

  let filerCode: string
  let sequence: string
  let checkDigit: string

  if (segments.length === 3) {
    filerCode = segments[0] as string
    sequence = segments[1] as string
    checkDigit = segments[2] as string
  } else if (segments.length === 1) {
    const only = segments[0] as string
    if (only.length !== 11) return { ok: false, reason: 'length', raw }
    filerCode = only.slice(0, 3)
    sequence = only.slice(3, 10)
    checkDigit = only.slice(10, 11)
  } else {
    return { ok: false, reason: 'length', raw }
  }

  const filerUpper = filerCode.toUpperCase()

  // When the caller supplied dashes (3 raw segments), a wrong filer
  // length OR non-alphanumeric filer should surface as
  // filer_code_invalid, not as generic length — more useful for the
  // analyst review queue.
  if (userSuppliedDashes) {
    if (filerCode.length !== 3 || !/^[A-Z0-9]{3}$/.test(filerUpper)) {
      return { ok: false, reason: 'filer_code_invalid', raw }
    }
  } else {
    if (filerCode.length !== 3) return { ok: false, reason: 'length', raw }
    if (!/^[A-Z0-9]{3}$/.test(filerUpper)) {
      return { ok: false, reason: 'filer_code_invalid', raw }
    }
  }

  if (sequence.length !== 7) return { ok: false, reason: 'length', raw }
  if (checkDigit.length !== 1) return { ok: false, reason: 'length', raw }

  if (!/^\d{7}$/.test(sequence)) {
    return { ok: false, reason: 'sequence_not_digits', raw }
  }
  if (!/^\d$/.test(checkDigit)) {
    return { ok: false, reason: 'check_digit_not_digit', raw }
  }

  return {
    ok: true,
    canonical: `${filerUpper}-${sequence}-${checkDigit}`,
    raw,
  }
}

/**
 * Display-form helper. Throws loudly on a non-canonical input so
 * callers can't accidentally render a raw entry number without
 * canonicalizing first.
 */
export function formatCanonicalEntryNumber(canonical: string): string {
  if (!CANONICAL_ENTRY_NUMBER_RE.test(canonical)) {
    throw new Error(
      `formatCanonicalEntryNumber: non-canonical input ${canonical} — canonicalize first`,
    )
  }
  return canonical
}
