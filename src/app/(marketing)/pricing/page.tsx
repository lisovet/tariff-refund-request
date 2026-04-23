import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import { TIERS, TIER_ORDER, type Tier } from '@contexts/billing'

/**
 * /pricing — two-tier commercial model (April 2026 repricing).
 *
 * The page mirrors the two-tier card structure rendered on the
 * qualified results page. Visitors on the marketing surface see
 * the same Audit / Full Prep comparison, but the CTA drops them
 * into the free screener so they see a tailored refund estimate
 * before they pay.
 *
 * Design-language rules (docs/DESIGN-LANGUAGE.md): hairline cards,
 * sharp corners, Berkeley Mono for money, GT Sectra for tier names,
 * no pill badges, no shadows, no pastel fills.
 */

export const metadata = {
  title: 'Pricing',
  description:
    'Two tiers. Audit for $99 — eligibility verdict and an action plan you run yourself. Full Prep for $999 + success fee — we build a validated, submission-ready CAPE file.',
}

export default function PricingPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Two tiers. No seat licenses.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          Start with a $99 Audit if you want the verdict and an action
          plan. Skip to Full Prep when you want us to build the
          submission-ready file for you.
        </p>
        <p className="mt-6 max-w-2xl text-base text-ink/65">
          The screener itself is free. You only pay once we have
          something concrete to give you in return.
        </p>
      </header>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-10 sm:py-32">
          <div className="grid gap-6 sm:grid-cols-2">
            {TIER_ORDER.map((id) => (
              <PricingTierCard key={id} tier={TIERS[id]} />
            ))}
          </div>
          <p className="mt-6 text-xs text-ink/60">
            Paid Audit first? The $99 credits toward Full Prep when you
            upgrade.
          </p>
        </div>
      </section>

      <Hairline label="II · Success fee" />

      <section
        id="success-fee"
        role="region"
        aria-label="Success fee"
        className="scroll-mt-24 bg-paper-2"
      >
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Success fee</Eyebrow>
          <h2
            id="success-fee-heading"
            className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl"
          >
            10 % of your estimated refund, capped at $25,000.
          </h2>
          <p className="mt-8 max-w-2xl text-lg text-ink/85">
            The success fee is added to Full Prep only, and it&rsquo;s
            computed against the <em>estimated</em> refund at checkout —
            not the amount CBP eventually posts. You owe nothing more if
            the refund lands higher than we estimated.
          </p>

          <SuccessFeeTable />

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <Callout
              eyebrow="Why upfront beats contingency"
              body="Charging a percentage of what CBP eventually pays means 60–90 days of float and open-ended liability if the refund is contested. Charging 10 % of the estimate at checkout lets us get paid on the work, not on CBP's timeline."
            />
            <Callout
              eyebrow="The $25,000 cap"
              body="At large refund sizes 10 % stops feeling like a service fee. The cap keeps large-importer economics sane without gutting mid-size deals where the percentage is modest."
            />
            <Callout
              eyebrow="Audit credit"
              body="If you paid $99 for the Audit first, we credit it toward the $999 Full Prep flat fee at checkout. No double-charging for the same eligibility work."
            />
          </div>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper-2">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10 sm:py-32">
          <h2 className="font-display text-4xl tracking-display text-ink sm:text-5xl">
            Start with the screener.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Free, three minutes, ten questions. You&rsquo;ll see both
            tiers again at the end with a refund estimate so the math is
            concrete.
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

function PricingTierCard({ tier }: { readonly tier: Tier }) {
  const priceMain = `$${(tier.flatUsdCents / 100).toLocaleString()}`
  const priceSub =
    tier.successFeePct !== undefined ? '+ success fee' : 'one time'
  return (
    <section
      data-tier={tier.id}
      className="flex h-full flex-col rounded-card border border-rule bg-paper p-8 sm:p-10"
    >
      <Eyebrow>{tier.eyebrow}</Eyebrow>
      <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
        {tier.name}
      </h2>
      <p className="mt-4 font-mono text-ink" data-price-mono>
        <span className="text-3xl">{priceMain}</span>{' '}
        <span className="text-sm text-ink/60">{priceSub}</span>
      </p>
      {tier.successFeePct !== undefined && (
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          {Math.round(tier.successFeePct * 100)}% of estimated refund · cap $
          {((tier.successFeeCapUsdCents ?? 0) / 100).toLocaleString()}
        </p>
      )}
      <p className="mt-6 text-base text-ink/85">{tier.pitch}</p>

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

      <Button as="a" href="/screener" variant="solid" size="lg">
        Check eligibility
      </Button>
    </section>
  )
}

interface FeeRow {
  readonly refund: number
  readonly flat: number
  readonly successFee: number
  readonly capped?: boolean
}

const FEE_ROWS: readonly FeeRow[] = [
  { refund: 5_000, flat: 999, successFee: 500 },
  { refund: 15_000, flat: 999, successFee: 1_500 },
  { refund: 30_000, flat: 999, successFee: 3_000 },
  { refund: 50_000, flat: 999, successFee: 5_000 },
  { refund: 100_000, flat: 999, successFee: 10_000 },
  { refund: 250_000, flat: 999, successFee: 25_000, capped: true },
  { refund: 500_000, flat: 999, successFee: 25_000, capped: true },
]

function fmt(usd: number): string {
  return `$${usd.toLocaleString('en-US')}`
}

function SuccessFeeTable() {
  return (
    <div className="mt-12 overflow-x-auto">
      <table
        aria-label="Success fee by estimated refund"
        className="w-full border-collapse text-left text-sm"
      >
        <thead>
          <tr className="border-y border-rule">
            <th className="py-3 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Estimated refund
            </th>
            <th className="py-3 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Flat fee
            </th>
            <th className="py-3 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Success fee
            </th>
            <th className="py-3 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Total
            </th>
            <th className="py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
              You keep
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {FEE_ROWS.map((r) => {
            const total = r.flat + r.successFee
            const keep = r.refund - r.successFee
            return (
              <tr key={r.refund}>
                <td className="py-4 pr-6 font-mono tabular-nums text-ink">
                  {fmt(r.refund)}
                </td>
                <td className="py-4 pr-6 font-mono tabular-nums text-ink/85">
                  {fmt(r.flat)}
                </td>
                <td className="py-4 pr-6 font-mono tabular-nums text-ink/85">
                  {fmt(r.successFee)}
                  {r.capped && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                      cap
                    </span>
                  )}
                </td>
                <td className="py-4 pr-6 font-mono tabular-nums text-ink/85">
                  {fmt(total)}
                </td>
                <td className="py-4 font-mono tabular-nums text-positive">
                  {fmt(keep)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Callout({
  eyebrow,
  body,
}: {
  readonly eyebrow: string
  readonly body: string
}) {
  return (
    <div className="border-l border-rule pl-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
        {eyebrow}
      </p>
      <p className="mt-3 text-sm text-ink/80">{body}</p>
    </div>
  )
}
