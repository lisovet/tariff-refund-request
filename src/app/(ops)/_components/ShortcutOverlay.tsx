'use client'

import { useEffect, useState } from 'react'

/**
 * Keyboard-shortcut overlay for the ops console per PRD 04.
 *
 * Triggered by `?` (shift-slash), closes on Escape or the close
 * button. The dialog is real `role="dialog"` with `aria-modal` so
 * screen readers enter it as a blocking region.
 *
 * Shortcut bindings are DECLARATIVE here — the handlers that
 * actually respond to `c` (claim), `x` (stall), etc. live in the
 * components that own the action (CaseHeaderPanel). This overlay's
 * job is the discovery surface so operators learn the bindings
 * once and retain them.
 */

export interface ShortcutRow {
  readonly keys: readonly string[]
  readonly description: string
  readonly scope: string
}

export const OPS_SHORTCUTS: readonly ShortcutRow[] = [
  {
    keys: ['?'],
    description: 'Open this keyboard-shortcut reference.',
    scope: 'Global',
  },
  {
    keys: ['g', 'q'],
    description: 'Go to the queue list.',
    scope: 'Global',
  },
  {
    keys: ['g', 'c'],
    description: 'Go to the case workspace you most recently claimed.',
    scope: 'Global',
  },
  {
    keys: ['j'],
    description: 'Move selection down in the queue.',
    scope: 'Queue',
  },
  {
    keys: ['k'],
    description: 'Move selection up in the queue.',
    scope: 'Queue',
  },
  {
    keys: ['Enter'],
    description: 'Open the currently selected queue row.',
    scope: 'Queue',
  },
  {
    keys: ['c'],
    description: 'Claim the current case.',
    scope: 'Case workspace',
  },
  {
    keys: ['x'],
    description: 'Mark the current case stalled.',
    scope: 'Case workspace',
  },
  {
    keys: ['/'],
    description: 'Focus the search / filter input.',
    scope: 'Queue',
  },
]

export function ShortcutOverlay() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore when focus is in an editable field — operators
      // typing into the reviewer-note surface should not be
      // hijacked by a `?`.
      const target = e.target as HTMLElement | null
      if (target && isEditable(target)) return

      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      // `?` arrives as shift+`/` on most layouts; react-dom
      // normalizes `e.key === '?'` when shift is down.
      if (e.key === '?') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto border border-rule bg-paper">
        <header className="flex items-center justify-between border-b border-rule px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Reference
            </p>
            <h2 className="font-display text-2xl tracking-display text-ink">
              Keyboard shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border border-rule bg-paper px-3 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink/80 hover:bg-paper-2"
            aria-label="Close shortcut reference"
          >
            Close
          </button>
        </header>
        <ShortcutTable rows={OPS_SHORTCUTS} />
      </div>
    </div>
  )
}

function ShortcutTable({ rows }: { rows: readonly ShortcutRow[] }) {
  const grouped = new Map<string, ShortcutRow[]>()
  for (const r of rows) {
    const list = grouped.get(r.scope) ?? []
    list.push(r)
    grouped.set(r.scope, list)
  }

  return (
    <div className="p-6">
      {Array.from(grouped.entries()).map(([scope, scopeRows]) => (
        <section key={scope} className="mb-6 last:mb-0">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55">
            {scope}
          </p>
          <ul className="space-y-2">
            {scopeRows.map((r) => (
              <li
                key={r.keys.join('+')}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="text-sm text-ink/85">{r.description}</span>
                <span className="flex items-center gap-1">
                  {r.keys.map((k) => (
                    <kbd
                      key={k}
                      className="inline-flex min-w-[1.5rem] items-center justify-center border border-rule bg-paper-2 px-2 py-0.5 font-mono text-xs text-ink"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function isEditable(el: HTMLElement): boolean {
  if (el.isContentEditable) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}
