import { Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * /for-agencies — partner-intake page per PRD 09.
 *
 * Phase 3 in the roadmap; Phase 0 scope here is a real page with
 * the three-tier economics + honest "what ships today vs later"
 * framing + a mailto intake. A real partner dashboard, Stripe
 * Connect payouts, and Tier 3 white-label come later.
 */

export const metadata = {
  title: 'Agencies & brokers',
  description:
    'Scale tariff recovery for your clients without building it. Three partner tiers: referral, co-branded, and white-label.',
}

interface Tier {
  readonly num: '01' | '02' | '03'
  readonly title: string
  readonly revShare: string
  readonly summary: string
  readonly detail: string
  readonly shipStatus: 'available now' | 'coming in Phase 3'
}

const TIERS: readonly Tier[] = [
  {
    num: '01',
    title: 'Referral partner',
    revShare: '15 – 25% rev share',
    summary:
      'A public referral link. You send leads; we screen, fulfil, and pay out monthly.',
    detail:
      'Your dashboard shows the leads you referred and the revenue you earned per month. No white-label — customers see us as their provider.',
    shipStatus: 'available now',
  },
  {
    num: '02',
    title: 'Co-branded',
    revShare: '25 – 35% rev share',
    summary:
      'Embed the screener on your site with your logo alongside ours. Higher rev share.',
    detail:
      'Dashboard surfaces referred-lead activity and per-customer state. You keep brand presence through the funnel.',
    shipStatus: 'available now',
  },
  {
    num: '03',
    title: 'White-label',
    revShare: 'bespoke',
    summary:
      'Run the full platform under your brand. You own the relationship; we operate the infrastructure.',
    detail:
      'Multi-tenant data isolation, custom domain with Railway-managed SSL, and a theme allowlist (one accent color + one paper color + your logo — no layout or typography overrides).',
    shipStatus: 'coming in Phase 3',
  },
] as const

export default function ForAgenciesPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>For partners</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Scale tariff recovery for your clients.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          Built for ecommerce agencies, customs brokers, fractional
          CFOs, and 3PLs. You already sit on an importer base that
          overpaid IEEPA duties. We handle the work; you keep a
          share of every case we close.
        </p>
        <div className="mt-12">
          <a
            href="mailto:partners@tariffrefundrequest.com?subject=Partner%20inquiry"
            className="inline-flex items-center gap-2 rounded-card bg-ink px-7 py-3.5 text-base font-sans text-paper transition-colors duration-160 ease-paper hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Become a partner
          </a>
        </div>
      </header>

      <Hairline label="The three tiers" />

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-10 sm:py-32">
          <ol className="grid gap-8 sm:grid-cols-3">
            {TIERS.map((t) => (
              <li
                key={t.num}
                className="flex flex-col rounded-card border border-rule bg-paper-2 p-8"
              >
                <Eyebrow>Tier {t.num}</Eyebrow>
                <h3 className="mt-4 font-display text-3xl tracking-display text-ink">
                  {t.title}
                </h3>
                <p className="mt-4 font-mono text-sm text-accent">{t.revShare}</p>
                <p className="mt-6 text-base text-ink/85">{t.summary}</p>
                <p className="mt-4 text-sm text-ink/70">{t.detail}</p>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/55">
                  {t.shipStatus}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Hairline label="What you get" />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                Available now (Tier 01 / 02)
              </h3>
              <ul className="mt-4 space-y-3 text-base text-ink/85">
                {[
                  'Referral link with attribution tracking.',
                  'Lead list + monthly revenue summary.',
                  'Marketing-asset library (badges, embed snippet).',
                  'Monthly payout via a supported method.',
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
                Coming in Phase 3 (Tier 03)
              </h3>
              <ul className="mt-4 space-y-3 text-base text-ink/85">
                {[
                  'Full white-label with custom domain + SSL.',
                  'Multi-tenant row-level isolation on every read.',
                  'Bulk lead import (CSV).',
                  'Stripe Connect payouts.',
                  'Attributed-case data export on request.',
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
        </div>
      </section>

      <Hairline label="Partner constraints" />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>What a partner agrees to</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            The ground rules.
          </h2>
          <ul className="mt-8 divide-y divide-rule border-y border-rule">
            {[
              'You do not guarantee CBP will approve any refund. The canonical trust promise applies to your customers too.',
              'You do not provide legal advice in the course of referring customers.',
              'White-label theming is constrained to two color tokens + a logo. No typography, layout, or component overrides — the design language travels with the product.',
              'You notify us of any change to your staff with platform access within one business day.',
              'Every partnership starts with a signed partner agreement before payouts begin.',
            ].map((line) => (
              <li
                key={line}
                className="flex items-baseline gap-4 py-5 text-base text-ink"
              >
                <span aria-hidden="true" className="font-mono text-accent">
                  —
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper-2">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10 sm:py-32">
          <h2 className="font-display text-4xl tracking-display text-ink sm:text-5xl">
            Want to partner?
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Email us with the client base you serve and the tier you
            want to start in. We reply within two business days.
          </p>
          <div className="mt-10 inline-block">
            <a
              href="mailto:partners@tariffrefundrequest.com?subject=Partner%20inquiry"
              className="inline-flex items-center gap-2 p-0 font-sans text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              partners@tariffrefundrequest.com
              <span aria-hidden="true">&nbsp;→</span>
            </a>
          </div>
          <p className="mt-8 text-sm text-ink/65">
            Before you commit, read{' '}
            <a
              href="/trust"
              className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              how we handle customer data
            </a>{' '}
            and the{' '}
            <a
              href="/trust/sub-processors"
              className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              sub-processor list
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
