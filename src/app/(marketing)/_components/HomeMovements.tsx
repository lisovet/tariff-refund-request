import { Eyebrow } from '@/app/_components/ui'

/**
 * Three-movement explainer per PRD 05: Recovery → Filing prep →
 * Concierge. Each rendered as a hairline-bordered movement (no
 * shadow, no rounded-full pill price badge). Mono numerics on prices
 * per docs/DESIGN-LANGUAGE.md.
 *
 * Pricing copy here is editorial — the canonical source of truth is
 * src/contexts/billing/pricing.ts (lands in task #34). The /pricing
 * page will pull from pricing.ts directly via snapshot in task #16.
 */

interface Movement {
  readonly stage: string
  readonly title: 'Recovery' | 'Filing prep' | 'Concierge'
  readonly priceLabel: string
  readonly summary: string
}

const MOVEMENTS: readonly Movement[] = [
  {
    stage: '01',
    title: 'Recovery',
    priceLabel: '$99 — $499',
    summary:
      'A personalized outreach kit and a secure upload portal. We help you reconstruct an entry list from broker, carrier, or ACE records.',
  },
  {
    stage: '02',
    title: 'Filing prep',
    priceLabel: '$199 — $999',
    summary:
      'Validated entries, a CBP-compliant CSV, and a Readiness Report your broker can submit unchanged.',
  },
  {
    stage: '03',
    title: 'Concierge',
    priceLabel: '$999+',
    summary:
      'Per-case high-touch support: e-signed engagement letter, ACE/ACH coordination, status monitoring, and a success fee on the realized refund.',
  },
]

export function HomeMovements() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <header className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
            Three movements, paid in stages.
          </h2>
        </header>

        <ol className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-3">
          {MOVEMENTS.map((m) => (
            <li
              key={m.title}
              className="flex flex-col rounded-card border border-rule bg-paper-2 p-8"
            >
              <Eyebrow>Stage {m.stage}</Eyebrow>
              <h3 className="mt-4 font-display text-3xl tracking-display text-ink">
                {m.title}
              </h3>
              <p className="mt-4 font-mono text-sm text-accent">
                {m.priceLabel}
              </p>
              <p className="mt-6 text-base text-ink/80">{m.summary}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
