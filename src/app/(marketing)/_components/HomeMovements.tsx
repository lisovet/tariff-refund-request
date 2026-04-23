import { Eyebrow } from '@/app/_components/ui'
import { TIERS, TIER_ORDER } from '@contexts/billing'

/**
 * Two-tier explainer on the homepage. Mirrors the commercial model
 * (Audit / Full Prep) that the rest of the funnel now runs on —
 * /pricing, /how-it-works, the results page tier cards, and the
 * confirmation flow. Copy pulls from the TIERS catalog so marketing
 * and pricing never drift.
 *
 * Each tier renders as a hairline-bordered card (no shadow, no pill
 * badge). Prices are Berkeley Mono per docs/DESIGN-LANGUAGE.md. No
 * "popular" / "best value" decorations — both tiers are legitimate
 * entry points depending on how much time the importer has.
 */

interface Movement {
  readonly num: '01' | '02'
  readonly title: string
  readonly priceLabel: string
  readonly summary: string
}

const PRICE_LABEL: Readonly<Record<'audit' | 'full_prep', string>> = {
  audit: '$99 · one-time',
  full_prep: '$999 due now + success fee',
}

const SUMMARY: Readonly<Record<'audit' | 'full_prep', string>> = {
  audit:
    "A written eligibility verdict, a defensible refund estimate, a personalized checklist, and every template you need to run the rest yourself — broker outreach, ACE setup, and the CAPE CSV spec.",
  full_prep:
    "We manage document collection, extract every entry number, build your validated CAPE file, and hand you a pre-submission confidence report — signed off by a named validator. You upload to ACE yourself; we never hit submit.",
}

const MOVEMENTS: readonly Movement[] = TIER_ORDER.map((id, i) => ({
  num: (i === 0 ? '01' : '02') as '01' | '02',
  title: TIERS[id].name,
  priceLabel: PRICE_LABEL[id],
  summary: SUMMARY[id],
}))

export function HomeMovements() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <header className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
            Two tiers. Pick what you have time for.
          </h2>
          <p className="mt-6 text-lg text-ink/75">
            Everyone starts with the same free eligibility screener.
            Then you decide: do the work yourself with our Audit
            packet, or hand it to us and get a submission-ready file
            back in five business days.
          </p>
        </header>

        <ol className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-2">
          {MOVEMENTS.map((m) => (
            <li
              key={m.title}
              className="flex flex-col rounded-card border border-rule bg-paper-2 p-8"
            >
              <Eyebrow>Tier {m.num}</Eyebrow>
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
