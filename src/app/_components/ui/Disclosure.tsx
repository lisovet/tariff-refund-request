/**
 * Canonical trust constants. Per
 * .claude/rules/disclosure-language-required.md: these strings appear
 * VERBATIM across surfaces — never paraphrased. Tests freeze the
 * exact wording so accidental edits fail loudly.
 */

export const CANONICAL_TRUST_PROMISE =
  'We help prepare your refund file. We do not guarantee CBP will approve it. We do not provide legal advice in this product. Every artifact you receive has been reviewed by a real person before it reaches you.'

export const NOT_LEGAL_ADVICE_DISCLOSURE =
  'Not legal advice. This site provides software and document-prep services. It is not legal advice, not a customs brokerage (unless your engagement letter explicitly says otherwise), and does not guarantee any outcome with U.S. Customs and Border Protection.'

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
 */
export function TrustFootnote({ asFooter = false }: TrustFootnoteProps) {
  const body = (
    <p className="text-sm text-ink/70">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
        Not legal advice
      </span>
      {' — '}
      This site provides software and document-prep services. It is not
      legal advice, not a customs brokerage (unless your engagement
      letter explicitly says otherwise), and does not guarantee any
      outcome with U.S. Customs and Border Protection.{' '}
      <a
        href="/trust"
        className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
      >
        Read the full trust posture →
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
