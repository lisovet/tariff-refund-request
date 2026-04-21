import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import {
  SUCCESS_FEE_HARD_CAP,
  SUCCESS_FEE_RATES,
  priceFor,
} from '@contexts/billing'
import { dollars } from '../_components/formatDollars'

/**
 * /concierge — Stage 03 deep-dive page per PRD 06 + PRD 02.
 *
 * Leads with the hand-off promise; makes the success-fee mechanic
 * unambiguous (rates read from pricing.ts, hard cap + "only if the
 * refund posts" disclosed prominently). Ties to the e-sign flow
 * without embedding the engagement letter (that's signed inside the
 * product, not on marketing).
 */

export const metadata = {
  title: 'Concierge',
  description:
    'Hand off the filing. We coordinate with your broker, resolve ACE / ACH gaps, and monitor through CBP response. Success fee only when the refund posts.',
}

export default function ConciergePage() {
  const baseSmb = priceFor('concierge_base', 'smb').usdCents
  const baseMid = priceFor('concierge_base', 'mid_market').usdCents
  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Stage 03</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Hand off the filing.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          We coordinate with your broker, resolve ACE / ACH
          prerequisite gaps, and monitor through CBP response. The
          success fee only posts if the refund does.
        </p>
        <div className="mt-12">
          <Button as="a" href="/screener" variant="solid" size="lg">
            Check eligibility
          </Button>
        </div>
      </header>

      <Hairline label="Pricing" />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Stage 03 pricing</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Base engagement fee plus a contingent success fee.
          </h2>

          <div
            data-sku="concierge_base"
            className="mt-12 grid gap-6 border-y border-rule py-8 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-12"
          >
            <div>
              <h3 className="font-display text-2xl text-ink">
                Concierge — engagement
              </h3>
              <p className="mt-3 text-base text-ink/75">
                Engagement letter e-signed before payment is captured.
                Coordination through filing + CBP response.
              </p>
            </div>
            <div
              data-price-mono
              className="font-mono text-lg text-accent sm:text-right"
            >
              {dollars(baseSmb)} – {dollars(baseMid)}
            </div>
          </div>

          <div className="mt-12 max-w-2xl space-y-6 text-base text-ink/85">
            <p>
              <span className="font-mono uppercase tracking-[0.16em] text-accent">
                Plus a success fee
              </span>{' '}
              calculated against the <em>realized refund</em>, not the
              pre-filing estimate. Bands are{' '}
              <span className="font-mono">
                {pct(SUCCESS_FEE_RATES.smb.min)}–
                {pct(SUCCESS_FEE_RATES.smb.max)}
              </span>{' '}
              for SMB and{' '}
              <span className="font-mono">
                {pct(SUCCESS_FEE_RATES.mid_market.min)}–
                {pct(SUCCESS_FEE_RATES.mid_market.max)}
              </span>{' '}
              for mid-market, capped at{' '}
              <span className="font-mono">
                {dollars(SUCCESS_FEE_HARD_CAP.usdCents)}
              </span>{' '}
              per case.
            </p>
            <p>
              We bill the success fee only after the refund posts. If
              the refund never posts, you owe nothing on the fee —
              only the base engagement.
            </p>
          </div>
        </div>
      </section>

      <Hairline label="Engagement letter" />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Before any payment</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            A real engagement letter. Signed before anything charges.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            The letter names the scope, the deliverables (signed
            Readiness Report, CBP-compatible CSV, coordination log,
            post-submission status summary), the success-fee mechanic,
            and the dispute-resolution process. You and we both sign
            via e-sign before Stripe captures the base fee.
          </p>
          <p className="mt-6 text-base text-ink/70">
            The letter carries the canonical{' '}
            <a
              href="/trust"
              className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              trust commitments
            </a>{' '}
            verbatim. Nothing in it is legal advice; your counsel
            reviews and you decide.
          </p>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                What we do
              </h3>
              <ul className="mt-4 space-y-3 text-base text-ink/85">
                {[
                  'Coordinate the actual filing — with your broker, your broker’s filer, or a partner in our network if you need one.',
                  'Handle ACE / ACH prerequisite gaps with a clear remediation plan you approve up-front.',
                  'Monitor CBP status weekly until the refund posts or CBP returns a deficiency.',
                  'Invoice the success fee against the realized refund — never against the estimate.',
                ].map((line) => (
                  <li key={line} className="flex items-baseline gap-3">
                    <span aria-hidden="true" className="font-mono text-accent">
                      →
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                What you do
              </h3>
              <ul className="mt-4 space-y-3 text-base text-ink/85">
                {[
                  'Sign the engagement letter (e-sign, before any payment is captured).',
                  'Approve the final batch and the filing actor (you, your broker, or our partner network).',
                  'Confirm receipt when the refund posts so we can close the case.',
                ].map((line) => (
                  <li key={line} className="flex items-baseline gap-3">
                    <span aria-hidden="true" className="font-mono text-accent">
                      →
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-12 border-l border-rule pl-6 font-display text-2xl text-ink">
            A filed claim, monitored to refund.
          </p>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper-2">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10 sm:py-32">
          <h2 className="font-display text-4xl tracking-display text-ink sm:text-5xl">
            Start with the screener.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Concierge applies once your entries are validated. The
            screener tells you whether you&apos;re a fit before you
            sign anything.
          </p>
          <div className="mt-10 inline-block">
            <Button as="a" href="/screener" variant="underline" size="lg">
              Check eligibility
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
