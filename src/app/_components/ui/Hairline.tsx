/**
 * 1px hairline rule. Used as a chapter break between sections (per
 * docs/DESIGN-LANGUAGE.md). When a label is set, the rule is split
 * around the label like a print article's section break.
 */

interface Props {
  readonly label?: string
  readonly className?: string
}

export function Hairline({ label, className = '' }: Props) {
  if (!label) {
    return <hr className={`border-0 border-t border-rule ${className}`.trim()} />
  }

  return (
    <div
      className={`flex items-center gap-4 ${className}`.trim()}
      role="separator"
      aria-label={label}
    >
      <hr className="flex-1 border-0 border-t border-rule" />
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
        {label}
      </span>
      <hr className="flex-1 border-0 border-t border-rule" />
    </div>
  )
}
