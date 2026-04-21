import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react'

/**
 * Two canonical CTAs per docs/DESIGN-LANGUAGE.md:
 *
 * - solid: ink-on-paper fill, slight 4px radius, no shadow. The
 *   "earn the emphasis" CTA — once per screen.
 * - underline: magazine-link pattern in customs-orange accent. The
 *   default for marketing CTAs and inline editorial actions.
 *
 * Both variants render as <button> by default and can switch to <a>
 * via the `as="a"` prop for navigation, preserving the visual style.
 *
 * Banned per minimalist-ui directives the design language inherits:
 * rounded-full, drop shadows, default Tailwind colors. We use the
 * design tokens directly.
 */

type Variant = 'solid' | 'underline'
type Size = 'md' | 'lg'

interface BaseProps {
  readonly variant?: Variant
  readonly size?: Size
  readonly disabled?: boolean
}

type ButtonProps = BaseProps & {
  readonly as?: 'button'
  readonly children: React.ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

type AnchorProps = BaseProps & {
  readonly as: 'a'
  readonly href: string
  readonly children: React.ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'>

type Props = ButtonProps | AnchorProps

const SIZE_CLASSES: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

function classes(variant: Variant, size: Size): string {
  const base =
    'inline-flex items-center gap-2 font-sans transition-colors duration-160 ease-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60'
  if (variant === 'solid') {
    return [
      base,
      SIZE_CLASSES[size],
      'rounded-card bg-ink text-paper hover:bg-ink/90 active:scale-[0.98]',
    ].join(' ')
  }
  // underline (magazine-link)
  return [
    base,
    'p-0 text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1',
  ].join(' ')
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  function Button(props, ref) {
    const variant = props.variant ?? 'solid'
    const size = props.size ?? 'md'
    const className = classes(variant, size)

    if (props.as === 'a') {
      const { children, href, disabled, as: _as, variant: _v, size: _s, ...rest } = props
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={className}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          {...rest}
        >
          {children}
          {variant === 'underline' && <span aria-hidden="true">&nbsp;→</span>}
        </a>
      )
    }

    const { children, disabled, as: _as, variant: _v, size: _s, ...rest } = props
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={rest.type ?? 'button'}
        className={className}
        disabled={disabled}
        {...rest}
      >
        {children}
        {variant === 'underline' && <span aria-hidden="true">&nbsp;→</span>}
      </button>
    )
  },
)
