import { Eyebrow } from '@/app/_components/ui'

/**
 * Three-movement explainer per PRD 05: Recovery → Filing prep →
 * Concierge. Each rendered as a hairline-bordered movement (no
 * shadow, no rounded-full pill price badge). Mono numerics on prices
 * per docs/DESIGN-LANGUAGE.md.
 *
 * Copy is leaner than v1 — each card reads like a magazine-sidebar,
 * not a pricing-tier pitch. The homepage promises "from $X" so the
 * ladder stays legible without freezing figures that change
 * quarterly. Exact prices + tier math live on /pricing.
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
    priceLabel: 'from $99',
    summary:
      'We rebuild your entry list from every broker and carrier on your shipments. Outreach kit, secure upload portal, and a case coordinator who chases the records that don’t return on their own.',
  },
  {
    stage: '02',
    title: 'Filing prep',
    priceLabel: 'from $199',
    summary:
      'Validated entries. A CBP-compliant CSV. A signed Readiness Report your broker can submit unchanged. Reviewed by a named validator before it reaches you.',
  },
  {
    stage: '03',
    title: 'Concierge',
    priceLabel: 'from $999 + success fee',
    summary:
      'End-to-end coordination with your broker or ours. Status monitoring through CBP review. The success fee only posts if the refund does.',
  },
]

export function HomeMovements() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <header className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
            Three stages. Paid as you reach them.
          </h2>
          <p className="mt-6 text-lg text-ink/75">
            Start free with the eligibility screener. You pay only
            for the stage you use, and only when you use it.
          </p>
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
