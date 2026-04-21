'use client'

import { useState } from 'react'
import { Button } from '@/app/_components/ui'

/**
 * Inline email-capture form shown on the disqualified results screen.
 * POSTs to /api/screener/notify-me, which writes a row to `leads`
 * with source='disqualified_notify'. The row is idempotent on
 * (email, sessionId) so re-submits are safe.
 */

type Status = 'idle' | 'submitting' | 'sent' | 'error'

interface Props {
  readonly sessionId: string | null
}

export function NotifyMeForm({ sessionId }: Props) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const disabled = !sessionId || status === 'submitting' || status === 'sent'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!sessionId) {
      setError('We could not attach this to your screener session. Please try again.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!consent) {
      setError('Please confirm you want to hear from us.')
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/screener/notify-me', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          email: email.trim(),
          consent: true,
        }),
      })
      if (!res.ok) {
        setStatus('error')
        setError('Something went wrong. Please try again in a moment.')
        return
      }
      setStatus('sent')
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again in a moment.')
    }
  }

  if (status === 'sent') {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Thanks — we&apos;ll be in touch if things change.
      </p>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Work email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full max-w-md rounded-card border border-rule bg-paper-2 px-4 py-3 text-ink focus:border-ink focus:outline-none"
          aria-label="Email"
          autoComplete="email"
          required
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
          aria-label="Email me if eligibility rules change"
          required
        />
        <span>
          Email me if eligibility rules change or our service expands to
          my situation. No other marketing.
        </span>
      </label>
      {error && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-600">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={disabled}>
          {status === 'submitting' ? 'Sending…' : 'Keep me posted'}
        </Button>
      </div>
    </form>
  )
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
