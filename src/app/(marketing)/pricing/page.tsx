import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import {
  SUCCESS_FEE_HARD_CAP,
  SUCCESS_FEE_RATES,
  priceFor,
  type Sku,
} from '@contexts/billing'
import { dollars } from '../_components/formatDollars'
import { BuyButton } from './_components/BuyButton'

/**
 * /pricing — stage-by-stage ladder per PRD 05 + PRD 06.
 *
 * The page mirrors `pricing.ts` verbatim — every figure is read from
 * `PRICE_LADDER` / `SUCCESS_FEE_RATES` / `SUCCESS_FEE_HARD_CAP`. No
 * hand-typed numbers; the ladder is the single source of truth and a
 * snapshot test keeps that property honest.
 *
 * Editorial conventions per the design language: tabular figures,
 * mono numerics, hairline-divided rows, no popular badge, free tier
 * rendered with the same weight as paid tiers, success-fee disclosure
 * prominent on the Concierge section.
 */

export const metadata = {
  title: 'Pricing',
  description:
    'Paid in stages. Free screener, then recovery and filing prep only when you reach them. Concierge is optional — base fee plus a success fee tied to the realized refund.',
}

interface StageRow {
  readonly sku: Sku | 'free'
  readonly label: string
  readonly priceLabel: string
  readonly note?: string
}

interface Stage {
  readonly id: string
  readonly num: '00' | '01' | '02'
  readonly title: string
  readonly tagline: string
  readonly rows: readonly StageRow[]
}

const STAGES: readonly Stage[] = [
  {
    id: 'screener',
    num: '00',
    title: 'See if it’s worth your time',
    tagline:
      'Ten questions. Three minutes. A real refund estimate at the end — no account required, no paywall.',
    rows: [
      {
        sku: 'free',
        label: 'Eligibility screener',
        priceLabel: 'Free',
        note: 'Always free. Returns a qualified estimate and a clear next step.',
      },
    ],
  },
  {
    id: 'recovery',
    num: '01',
    title: 'Rebuild your entry list',
    tagline:
      'Every entry you made during the IEEPA window, with its source document. Run it yourself with our outreach kit, or hand us the documents and an analyst extracts them.',
    rows: [
      {
        sku: 'recovery_kit',
        label: 'Recovery Kit (DIY)',
        priceLabel: `${dollars(priceFor('recovery_kit', 'smb').usdCents)} – ${dollars(priceFor('recovery_kit', 'mid_market').usdCents)}`,
        note: 'Outreach templates for your broker / carrier / ACE export, plus the secure upload portal.',
      },
      {
        sku: 'recovery_service',
        label: 'Recovery Service (we extract)',
        priceLabel: `${dollars(priceFor('recovery_service', 'smb').usdCents)} – ${dollars(priceFor('recovery_service', 'mid_market').usdCents)}`,
        note: 'Analyst extracts and verifies entries directly from the documents you upload.',
      },
    ],
  },
  {
    id: 'prep',
    num: '02',
    title: 'Turn it into a submission-ready package',
    tagline:
      'A CBP-compliant CSV and a signed Readiness Report your broker can file unchanged. Reviewed by a named validator before it reaches you.',
    rows: [
      {
        sku: 'cape_prep_standard',
        label: 'CAPE Prep — Standard',
        priceLabel: `${dollars(priceFor('cape_prep_standard', 'smb').usdCents)} – ${dollars(priceFor('cape_prep_standard', 'mid_market').usdCents)}`,
        note: 'Format checks, dedupe, batch grouping, Readiness Report draft.',
      },
      {
        sku: 'cape_prep_premium',
        label: 'CAPE Prep — Premium',
        priceLabel: `${dollars(priceFor('cape_prep_premium', 'smb').usdCents)} – ${dollars(priceFor('cape_prep_premium', 'mid_market').usdCents)}`,
        note: 'Phase segmentation, prerequisite-gap remediation plan, validator review.',
      },
    ],
  },
] as const

export default function PricingPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Paid in stages.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          You can stop at any stage. Each one delivers a concrete
          artifact — a recovered entry list, a submission-ready file,
          a monitored claim — and is priced on its own.
        </p>
        <p className="mt-6 max-w-2xl text-base text-ink/65">
          Bands span SMB and mid-market. Your case is priced as
          mid-market if it has 100+ entries or
          <span className="font-mono"> $50,000+ </span>
          in IEEPA duty paid.
        </p>
      </header>

      <Hairline />

      {STAGES.map((stage, index) => (
        <section
          key={stage.id}
          id={stage.id}
          aria-labelledby={`stage-${stage.id}-heading`}
          className="scroll-mt-24 bg-paper"
        >
          <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
            <Eyebrow>Stage {stage.num}</Eyebrow>
            <h2
              id={`stage-${stage.id}-heading`}
              className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl"
            >
              {stage.title}
            </h2>
            <p className="mt-8 max-w-2xl text-xl text-ink/85">
              {stage.tagline}
            </p>

            <div className="mt-16 divide-y divide-rule border-y border-rule">
              {stage.rows.map((row) => (
                <div
                  key={`${stage.id}__${row.sku}`}
                  data-sku={row.sku}
                  className="grid gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-12"
                >
                  <div>
                    <h3 className="font-display text-2xl text-ink">
                      {row.label}
                    </h3>
                    {row.note && (
                      <p className="mt-3 text-base text-ink/75">{row.note}</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <div
                      data-price-mono
                      className="font-mono text-lg text-accent"
                    >
                      {row.priceLabel}
                    </div>
                    {row.sku !== 'free' ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3 sm:justify-end">
                        <BuyButton
                          sku={row.sku}
                          tier="smb"
                          anchor={`#${stage.id}`}
                          label={`Buy · SMB · ${dollars(priceFor(row.sku, 'smb').usdCents)}`}
                        />
                        <BuyButton
                          sku={row.sku}
                          tier="mid_market"
                          anchor={`#${stage.id}`}
                          label={`Buy · Mid-market · ${dollars(priceFor(row.sku, 'mid_market').usdCents)}`}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {index < STAGES.length - 1 && (
            <Hairline label={`II · Stage ${STAGES[index + 1]?.num}`} />
          )}
        </section>
      ))}

      <Hairline label="III · Concierge" />

      <section
        id="concierge"
        aria-labelledby="concierge-heading"
        role="region"
        aria-label="Concierge"
        className="scroll-mt-24 bg-paper-2"
      >
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Stage 03 — bespoke</Eyebrow>
          <h2
            id="concierge-heading"
            className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl"
          >
            Concierge
          </h2>
          <p className="mt-8 max-w-2xl text-xl text-ink/85">
            Hand off the filing. We coordinate with your broker,
            resolve ACE / ACH prerequisite gaps, and monitor through
            CBP response. Success fee only when the refund posts.
          </p>

          <div
            data-sku="concierge_base"
            className="mt-16 grid gap-6 border-y border-rule py-8 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-12"
          >
            <div>
              <h3 className="font-display text-2xl text-ink">
                Concierge — engagement
              </h3>
              <p className="mt-3 text-base text-ink/75">
                Engagement letter, signed before any payment is captured.
                Coordination through filing and CBP response.
              </p>
            </div>
            <div className="sm:text-right">
              <div data-price-mono className="font-mono text-lg text-accent">
                {dollars(priceFor('concierge_base', 'smb').usdCents)} – {dollars(priceFor('concierge_base', 'mid_market').usdCents)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 sm:justify-end">
                <BuyButton
                  sku="concierge_base"
                  tier="smb"
                  anchor="#concierge"
                  label={`Buy · SMB · ${dollars(priceFor('concierge_base', 'smb').usdCents)}`}
                />
                <BuyButton
                  sku="concierge_base"
                  tier="mid_market"
                  anchor="#concierge"
                  label={`Buy · Mid-market · ${dollars(priceFor('concierge_base', 'mid_market').usdCents)}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-2xl space-y-6 text-base text-ink/85">
            <p>
              <span className="font-mono uppercase tracking-[0.16em] text-accent">
                Plus a success fee
              </span>{' '}
              calculated against the <em>realized refund</em>, not the
              pre-filing estimate. Bands are{' '}
              <span className="font-mono">{Math.round(SUCCESS_FEE_RATES.smb.min * 100)}–{Math.round(SUCCESS_FEE_RATES.smb.max * 100)}%</span>{' '}
              for SMB and{' '}
              <span className="font-mono">{Math.round(SUCCESS_FEE_RATES.mid_market.min * 100)}–{Math.round(SUCCESS_FEE_RATES.mid_market.max * 100)}%</span>{' '}
              for mid-market, capped at{' '}
              <span className="font-mono">{dollars(SUCCESS_FEE_HARD_CAP.usdCents)}</span>{' '}
              per case.
            </p>
            <p>
              We bill the success fee only after the refund posts. If
              the refund never posts, you owe nothing on the success
              fee — only the engagement.
            </p>
          </div>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Monitoring</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Stay informed after you file.
          </h2>
          <div
            data-sku="monitoring"
            className="mt-12 grid gap-6 border-y border-rule py-8 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-12"
          >
            <div>
              <h3 className="font-display text-2xl text-ink">
                Ongoing monitoring (subscription)
              </h3>
              <p className="mt-3 text-base text-ink/75">
                Weekly CBP-status pulls, anomaly alerts, and a single
                dashboard if you have multiple entities. Cancel any time.
                Annual prepay gets two months free.
              </p>
            </div>
            <div className="sm:text-right">
              <div data-price-mono className="font-mono text-lg text-accent">
                {dollars(priceFor('monitoring', 'smb').usdCents)} – {dollars(priceFor('monitoring', 'mid_market').usdCents)}
                <span className="ml-1 text-ink/55">/ mo</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 sm:justify-end">
                <BuyButton
                  sku="monitoring"
                  tier="smb"
                  label={`Subscribe · SMB · ${dollars(priceFor('monitoring', 'smb').usdCents)}/mo`}
                />
                <BuyButton
                  sku="monitoring"
                  tier="mid_market"
                  label={`Subscribe · Mid-market · ${dollars(priceFor('monitoring', 'mid_market').usdCents)}/mo`}
                />
              </div>
            </div>
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
            The screener is free. You only hit a paywall once we have
            something concrete to give you in return.
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
