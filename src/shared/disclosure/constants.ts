/**
 * Canonical disclosure strings per
 * `.claude/rules/disclosure-language-required.md`.
 *
 * These are the SINGLE SOURCE of truth for every customer-facing
 * surface that needs the trust posture: marketing pages, customer
 * app, emails, Readiness Report PDF, engagement letters. Changing
 * the wording requires explicit approval; the test suite freezes
 * the strings verbatim.
 *
 * No React types, no JSX — pure strings so react-pdf, email HTML,
 * and Next components can all import from the same module.
 */

export const CANONICAL_TRUST_PROMISE =
  'We help prepare your refund file. We do not guarantee CBP will approve it. We do not provide legal advice in this product. Every artifact you receive has been reviewed by a real person before it reaches you.'

/**
 * Short "Not legal advice" — the footer disclosure per PRD 10's
 * "Required disclosures" table. Appears in every footer (marketing,
 * app, ops), in every email, and at the bottom of the Readiness
 * Report PDF. The customs-broker carve-out moved out of this
 * sentence because (a) it was confusing on the public footer where
 * no visitor has an engagement letter yet, and (b) PRD 10 scopes
 * that disclosure to /trust + engagement letters.
 */
export const NOT_LEGAL_ADVICE_DISCLOSURE =
  'Not legal advice. This site provides software and document-prep services. It is not legal advice and does not guarantee any outcome with U.S. Customs and Border Protection.'

/**
 * Customs-broker scope clause per PRD 10. Appears on /trust, in the
 * home "What we are not" list, and in engagement letter bodies —
 * never in the site-wide footer.
 */
export const NOT_A_CUSTOMS_BROKER_CLAUSE =
  'Not a customs broker, unless your engagement letter explicitly names us in that capacity.'

/**
 * Surface-specific clause per the disclosure rule's "Required
 * surfaces" list. Appears on /how-it-works, /cape-prep, /trust, and
 * every Readiness Report PDF.
 */
export const SUBMISSION_CONTROL_CLAUSE =
  'We prepare files; you control submission.'

/**
 * Surface-specific clause per the disclosure rule's "Required
 * surfaces" list. Appears on /concierge and the `pending_cbp` state
 * screen.
 */
export const REFUND_TIMING_CLAUSE = 'Refund timing depends on CBP review.'
