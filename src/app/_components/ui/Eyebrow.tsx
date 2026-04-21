import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Small uppercase mono label that sits above section headings — the
 * "STAGE 02" / "RECOVERY" / "FOOTNOTE" pattern. Per
 * docs/DESIGN-LANGUAGE.md, used for section labels but never as a
 * standalone headline.
 */

interface Props extends HTMLAttributes<HTMLElement> {
  readonly children: ReactNode
}

export function Eyebrow({ children, className = '', ...rest }: Props) {
  return (
    <span
      className={`font-mono text-xs uppercase tracking-[0.2em] text-ink/60 ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  )
}
