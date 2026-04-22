/**
 * Canonical trust constants. Per
 * .claude/rules/disclosure-language-required.md: these strings appear
 * VERBATIM across surfaces — never paraphrased. Tests freeze the
 * exact wording so accidental edits fail loudly.
 *
 * Constants live in the shared disclosure module so non-UI surfaces
 * (email templates, Readiness Report PDF, engagement letters) can
 * import the same source without pulling React into their bundle.
 */

import { NOT_LEGAL_ADVICE_DISCLOSURE } from '@/shared/disclosure/constants'

export {
  CANONICAL_TRUST_PROMISE,
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
  REFUND_TIMING_CLAUSE,
} from '@/shared/disclosure/constants'

interface TrustFootnoteProps {
  /**
   * When true, render inside its own <footer> landmark (use for /app
   * + /ops route groups that don't already have a SiteFooter). Default
   * false — the marketing SiteFooter wraps this and supplies the
   * landmark itself.
   */
  readonly asFooter?: boolean
}

/**
 * Compact disclosure block. Used inline by the marketing SiteFooter
 * and as a standalone footer on /app + /ops via `asFooter`.
 *
 * The sentence after the "Not legal advice" eyebrow strips the
 * leading marker (the eyebrow serves that role visually) and renders
 * the rest of the constant. Keeping the prose source-of-truth in the
 * shared constant means the footer can never drift from the PDF or
 * email footers.
 */
export function TrustFootnote({ asFooter = false }: TrustFootnoteProps) {
  const body = (
    <p className="text-sm text-ink/70">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
        Not legal advice
      </span>
      {' — '}
      {NOT_LEGAL_ADVICE_DISCLOSURE.replace(/^Not legal advice\.\s*/, '')}{' '}
      <a
        href="/trust"
        className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
      >
        How we handle your data →
      </a>
    </p>
  )

  if (asFooter) {
    return (
      <footer className="border-t border-rule bg-paper-2 px-6 py-6 sm:px-10">
        <div className="mx-auto max-w-6xl">{body}</div>
      </footer>
    )
  }

  return body
}
