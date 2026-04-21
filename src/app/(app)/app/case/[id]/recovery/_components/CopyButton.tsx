'use client'

import { useCallback, useEffect, useState, type ReactElement } from 'react'

/**
 * Tiny client component for the "copy to clipboard" affordance on
 * the outreach kit. Uses navigator.clipboard.writeText. Falls back
 * silently to a visible "couldn't copy" hint if the API isn't
 * available (older Safari, insecure context).
 */

export interface CopyButtonProps {
  readonly text: string
  readonly label?: string
  readonly className?: string
}

export function CopyButton({
  text,
  label = 'Copy to clipboard',
  className,
}: CopyButtonProps): ReactElement {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  // Reset to idle after a short window so subsequent copies show feedback.
  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 1600)
    return () => clearTimeout(t)
  }, [state])

  const handleCopy = useCallback(async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        setState('failed')
        return
      }
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid="copy-button"
      data-state={state}
      className={`underline decoration-accent decoration-2 underline-offset-4 ${
        className ?? ''
      }`.trim()}
    >
      {state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : label}
    </button>
  )
}
