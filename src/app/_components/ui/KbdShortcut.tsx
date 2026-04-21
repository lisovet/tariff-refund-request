import { Fragment } from 'react'

/**
 * Keystroke chip per minimalist-ui directive: render shortcuts as
 * physical-looking keys via <kbd>, joined by `+` for chords. Used
 * heavily in the ops console (PRD 04 — keyboard-first workflow).
 */

interface Props {
  readonly keys: readonly string[]
}

export function KbdShortcut({ keys }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <Fragment key={`${k}-${i}`}>
          {i > 0 && <span className="text-xs text-ink/40">+</span>}
          <kbd className="rounded-card border border-rule bg-paper-2 px-2 py-0.5 font-mono text-xs text-ink">
            {k}
          </kbd>
        </Fragment>
      ))}
    </span>
  )
}
