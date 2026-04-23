'use client'

import { useState } from 'react'

/**
 * Tier-specific "Buy" button on /pricing.
 *
 * Auth enforcement is server-side (see `src/app/api/checkout/route.ts`):
 * an unauthenticated POST returns 401, which this component translates
 * into a client-side redirect to `/sign-up?redirect_url=...`. That
 * keeps the button free of any `@clerk/nextjs` hooks — important
 * because `/pricing` lives under the `(marketing)` layout, which does
 * not mount a `ClerkProvider`. Calling `useAuth` here would crash
 * static prerender.
 *
 * Feature-flagged via `NEXT_PUBLIC_PURCHASE_ENABLED`. Renders nothing
 * until the flag is literally the string "true".
 *
 * POSTs to `/api/checkout`, which returns the Stripe-hosted session
 * URL — we then navigate the browser there.
 */

export interface BuyButtonProps {
  readonly sku:
    | 'recovery_kit'
    | 'recovery_service'
    | 'cape_prep_standard'
    | 'cape_prep_premium'
    | 'concierge_base'
    | 'monitoring'
  readonly tier: 'smb' | 'mid_market'
  readonly label: string
  /** Anchor on /pricing to return to after sign-up (e.g. "#recovery"). */
  readonly anchor?: string
}

const PURCHASE_ENABLED = process.env.NEXT_PUBLIC_PURCHASE_ENABLED === 'true'

export function BuyButton({ sku, tier, label, anchor }: BuyButtonProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!PURCHASE_ENABLED) return null

  async function onClick() {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sku,
          tier,
          // Every checkout needs a session id — a uuid is fine for
          // direct /pricing purchases; the field is used for cadence
          // cancellation + case attribution.
          screenerSessionId: crypto.randomUUID(),
        }),
      })

      if (res.status === 401) {
        // Server enforced the signup-first gate; redirect the user
        // through sign-up and bring them back to the same tier.
        const back = `/pricing${anchor ?? ''}`
        window.location.href = `/sign-up?redirect_url=${encodeURIComponent(back)}`
        return
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body?.error ?? `checkout failed (${res.status})`)
      }

      const { url } = (await res.json()) as { url: string }
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setPending(false)
    }
  }

  return (
    <div className="mt-4 flex items-center gap-4">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        data-testid={`buy-${sku}-${tier}`}
        className="inline-flex items-center gap-2 bg-ink px-5 py-2.5 font-sans text-sm text-paper transition-colors duration-160 ease-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Opening checkout…' : label}
      </button>
      {error ? (
        <p className="font-mono text-xs text-blocking" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
