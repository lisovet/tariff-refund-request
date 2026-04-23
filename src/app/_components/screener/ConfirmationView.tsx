'use client'

import { useSearchParams } from 'next/navigation'
import { Eyebrow, Hairline } from '@/app/_components/ui'
import { TIERS, isTierId, type TierId } from '@contexts/billing'

/**
 * Post-payment confirmation surface. Reads `?tier=audit|full_prep`
 * from the URL and renders the right flavor of "here's what happens
 * next" copy.
 *
 * Today the Pay button is a stub (pure client-side push) — there is
 * no real payment yet. This view is deliberately neutral about the
 * payment state: the eyebrow says "Payment received" because that is
 * what the surface represents in production, but nothing implies we
 * submit to CBP on the user's behalf (see
 * .claude/rules/never-auto-submit.md).
 */

interface Step {
  readonly title: string
  readonly detail: string
}

const NEXT_STEPS: Readonly<Record<TierId, readonly Step[]>> = {
  audit: [
    {
      title: 'Your account manager reaches out within 24 hours.',
      detail:
        'Email plus a phone number if you prefer voice. No sales pitch — just a hand-off to the analyst running your audit.',
    },
    {
      title: "You'll get the audit packet when it's ready.",
      detail:
        'Eligibility verdict, estimated refund range, personalized checklist, broker outreach template, ACE setup guide, and the CAPE CSV spec. Everything you need to take it from here yourself.',
    },
  ],
  full_prep: [
    {
      title: 'Your account manager reaches out within 24 hours.',
      detail:
        'Email plus a phone number if you prefer voice. They become your single point of contact through delivery.',
    },
    {
      title: 'They send the exact document checklist for your clearance path.',
      detail:
        'Broker statements, carrier records, ACE exports — only what we actually need. We follow up with your broker or carrier directly if that is faster.',
    },
    {
      title: 'Our analyst extracts entries and builds your package.',
      detail:
        'Every entry row carries a source + confidence record. Phase 1 / Phase 2 separated. Five-day turnaround SLA from documents received.',
    },
    {
      title: 'You receive a submission-ready file with a Readiness Report.',
      detail:
        'Reviewed and signed by a named validator before it reaches you. You (or your broker) upload to ACE — we never submit on your behalf.',
    },
  ],
}

function resolveTier(raw: string | null): TierId {
  return isTierId(raw) ? raw : 'audit'
}

export function ConfirmationView() {
  const params = useSearchParams()
  const tierId = resolveTier(params.get('tier'))
  const tier = TIERS[tierId]
  const steps = NEXT_STEPS[tierId]

  return (
    <article className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
      <Eyebrow>Payment received</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
        You&rsquo;re in. A specialist will be in touch within 24 hours.
      </h1>
      <p className="mt-8 text-lg text-ink/85">
        Thanks for starting with us on{' '}
        <span className="font-medium text-ink">{tier.name}</span>. We only ask
        for paperwork once we know exactly what we need — no blanket document
        request up front.
      </p>

      <aside
        aria-label="Homework email"
        className="mt-10 border-l-2 border-accent pl-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Check your inbox
        </p>
        <p className="mt-3 text-base text-ink/85">
          You&rsquo;ll also get an automated email in the next few minutes with
          the standard documents and records most importers need for a refund
          file — broker statements, carrier records, ACE exports, HTS codes
          by entry. Start pulling these together while your account manager
          reviews your case. The final checklist we send back will be
          tailored, but this gets you a head start.
        </p>
      </aside>

      <Hairline className="my-12" />

      <section>
        <Eyebrow>Here&rsquo;s what happens next</Eyebrow>
        <ol className="mt-6 divide-y divide-rule border-y border-rule">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-6 py-6">
              <span
                aria-hidden="true"
                className="font-mono text-sm tabular-nums text-ink/60"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-base font-medium text-ink">{step.title}</p>
                <p className="mt-2 text-sm text-ink/75">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 flex flex-wrap items-baseline gap-6">
        <a
          href="/screener"
          className="text-sm text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
        >
          Back to results
        </a>
        <a
          href="/how-it-works"
          className="text-sm text-accent/80 underline underline-offset-[6px] decoration-accent/30 hover:decoration-accent decoration-1"
        >
          Read how it works
        </a>
      </div>

      <p className="mt-16 max-w-2xl border-t border-rule pt-6 text-xs text-ink/55">
        We help prepare your refund file. We do not guarantee CBP will approve
        it. We do not provide legal advice in this product. Every artifact you
        receive has been reviewed by a real person before it reaches you.
      </p>
    </article>
  )
}
