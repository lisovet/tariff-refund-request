'use client'

import { useRouter } from 'next/navigation'
import { Eyebrow } from '@/app/_components/ui'
import { TIERS, TIER_ORDER, type TierId } from '@contexts/billing'
import { TierCard } from './TierCard'

/**
 * The two-card tier selection block rendered below the filing
 * readiness list on a qualified results page. Clicking Pay pushes
 * the user to /screener/confirmation — today a pure client-side
 * navigation; Stripe Checkout will slot in here later.
 */

interface Props {
  readonly recommendedTier: TierId
}

export function TierSelection({ recommendedTier }: Props) {
  const router = useRouter()
  const onPay = (id: TierId) => {
    router.push(`/screener/confirmation?tier=${id}`)
  }

  return (
    <section>
      <Eyebrow>Choose how we handle it</Eyebrow>
      <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
        Pick the level of support you want.
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {TIER_ORDER.map((id) => (
          <TierCard
            key={id}
            tier={TIERS[id]}
            recommended={id === recommendedTier}
            onPay={onPay}
          />
        ))}
      </div>
      <p className="mt-6 text-xs text-ink/60">
        Paid Audit? The $99 credits toward Full Prep if you upgrade.
      </p>
    </section>
  )
}
