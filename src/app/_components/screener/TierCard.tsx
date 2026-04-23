'use client'

import { Button, Eyebrow } from '@/app/_components/ui'
import type { Tier } from '@contexts/billing'

/**
 * Single tier card used on the results page + /pricing.
 *
 * Dumb by design: no router dependency, no screener state. Parent
 * owns navigation via `onPay`. Design-language rules: hairline border,
 * sharp corners, no shadow. The recommended card gets a one-step
 * stronger border (`border-accent`) plus a small "Recommended" eyebrow.
 */

interface Props {
  readonly tier: Tier
  readonly recommended?: boolean
  readonly onPay: (id: Tier['id']) => void
}

export function TierCard({ tier, recommended = false, onPay }: Props) {
  const priceMain = `$${(tier.flatUsdCents / 100).toLocaleString()}`
  const priceSub =
    tier.successFeePct !== undefined ? 'due now' : 'one time'

  return (
    <section
      aria-label={recommended ? 'Recommended' : undefined}
      className={`flex h-full flex-col rounded-card border bg-paper p-8 sm:p-10 ${
        recommended ? 'border-accent' : 'border-rule'
      }`}
    >
      <header>
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow>{tier.eyebrow}</Eyebrow>
          {recommended && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Recommended
            </span>
          )}
        </div>
        <h3 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
          {tier.name}
        </h3>
        <p className="mt-4 font-mono text-ink">
          <span className="text-3xl">{priceMain}</span>{' '}
          <span className="text-sm text-ink/60">{priceSub}</span>
        </p>
        {tier.successFeePct !== undefined && (
          <>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
              + {Math.round(tier.successFeePct * 100)}% of estimated refund · cap $
              {((tier.successFeeCapUsdCents ?? 0) / 100).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-ink/60">
              You pay $
              {(tier.flatUsdCents / 100).toLocaleString()} now. The success fee
              is billed only after your file is delivered.
            </p>
          </>
        )}
        <p className="mt-6 text-base text-ink/85">{tier.pitch}</p>
      </header>

      <div className="mt-8 border-t border-rule pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
          What&rsquo;s included
        </p>
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {tier.included.map((item) => (
            <li
              key={item}
              className="flex items-start gap-4 py-3 text-sm text-ink/85"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 font-mono text-sm text-positive"
              >
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {tier.notIncluded && tier.notIncluded.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
            Not included
          </p>
          <ul className="mt-3 space-y-2">
            {tier.notIncluded.map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 text-sm text-ink/55"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 font-mono text-sm text-ink/40"
                >
                  ×
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex-1" />

      <Button
        type="button"
        variant="solid"
        size="lg"
        aria-label={tier.ctaLabelAccessible}
        onClick={() => onPay(tier.id)}
      >
        {tier.ctaLabelShort}
      </Button>
    </section>
  )
}
