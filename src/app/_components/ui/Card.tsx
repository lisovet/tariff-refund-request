import { useId, type HTMLAttributes, type ReactNode } from 'react'

/**
 * Hairline-bordered editorial card. No drop shadow (per
 * minimalist-ui directives + docs/DESIGN-LANGUAGE.md). Generous
 * internal padding by default; titles render in the display face.
 */

interface Props extends HTMLAttributes<HTMLElement> {
  readonly title?: string
  readonly children: ReactNode
}

export function Card({ title, children, className = '', ...rest }: Props) {
  const headingId = useId()
  return (
    <section
      className={`rounded-card border border-rule bg-paper-2 p-6 sm:p-8 ${className}`.trim()}
      {...(title ? { 'aria-labelledby': headingId } : {})}
      {...rest}
    >
      {title && (
        <h2
          id={headingId}
          className="mb-4 font-display text-2xl tracking-display text-ink"
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
