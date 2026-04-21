import type { ReactNode } from 'react'

/**
 * A real superscripted footnote reference, with a paired content
 * block intended to live in a page footer. Per
 * docs/DESIGN-LANGUAGE.md + .claude/rules/disclosure-language-required.md:
 * disclosures must be real footnotes — never collapsed accordions or
 * banners hiding required text.
 *
 * Two callsites:
 *   <Footnote id="fn-1">…</Footnote>           // inline reference
 *   <FootnoteContent id="fn-1">…</FootnoteContent>  // footer entry
 */

interface FootnoteProps {
  readonly id: string
  readonly children: ReactNode
}

export function Footnote({ id, children }: FootnoteProps) {
  return (
    <sup className="ml-0.5 text-[0.65em] leading-none">
      <a href={`#${id}-content`} className="text-accent underline underline-offset-2">
        <span className="sr-only">Footnote: {children}</span>
        <span aria-hidden="true">[fn]</span>
      </a>
    </sup>
  )
}

export function FootnoteContent({ id, children }: FootnoteProps) {
  return (
    <li id={`${id}-content`} className="text-sm text-ink/70">
      {children}
    </li>
  )
}
