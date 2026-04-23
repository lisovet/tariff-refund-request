'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

/**
 * Tier-specific "Buy" button on /pricing. Auth-gated: anonymous
 * clickers are redirected to `/sign-up` with a `redirect_url` that
 * brings them back to the same tier anchor so the second click goes
 * straight to Stripe.
 *
 * Feature-flagged via `NEXT_PUBLIC_PURCHASE_ENABLED`. `BuyButton` is
 * a gate: it checks the flag and then defers to `ActiveBuyButton`.
 * The split exists so the no-op render happens without calling
 * `useRouter` / `useAuth` — components in tests or marketing pages
 * that don't mount the App Router + ClerkProvider would otherwise
 * throw every render.
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

export function BuyButton(props: BuyButtonProps) {
  if (!PURCHASE_ENABLED) return null
  return <ActiveBuyButton {...props} />
}

function ActiveBuyButton({ sku, tier, label, anchor }: BuyButtonProps) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    if (!isLoaded) return
    if (!isSignedIn) {
      const back = `/pricing${anchor ?? ''}`
      router.push(`/sign-up?redirect_url=${encodeURIComponent(back)}`)
      return
    }

    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sku,
          tier,
          // Every checkout needs a session id — a case-workspace-scoped
          // uuid is fine for direct /pricing purchases; the field is
          // used for cadence cancellation + case attribution.
          screenerSessionId: crypto.randomUUID(),
        }),
      })
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
        disabled={pending || !isLoaded}
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
