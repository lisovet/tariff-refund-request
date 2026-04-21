import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import { priceFor } from '@contexts/billing'
import { dollars } from '../_components/formatDollars'

/**
 * /recovery — Stage 01 deep-dive page per PRD 02 + PRD 05.
 *
 * Editorial long-form that mirrors /how-it-works/page.tsx structure
 * but scoped to just the Recovery stage. Pricing is read from
 * src/contexts/billing/pricing.ts via priceFor() — no hardcoded
 * numbers.
 */

export const metadata = {
  title: 'Recovery',
  description:
    'Rebuild your entry list. We reconcile every broker, carrier, and ACE account your shipments touched — reconciled into one provenance-checked record.',
}

interface Path {
  readonly label: string
  readonly summary: string
  readonly detail: string
}

const PATHS: readonly Path[] = [
  {
    label: 'Broker path',
    summary:
      'Your customs broker has the entries — you just need them in a usable format.',
    detail:
      'We generate a personalized outreach email for your broker and a checklist of what to ask for (entry summaries, 7501s, duty invoices). We follow up on a four-day cadence if they go quiet.',
  },
  {
    label: 'Carrier path',
    summary:
      'No broker relationship, or the broker is gone. The carrier still has the records.',
    detail:
      'DHL, FedEx, UPS, and ocean carriers all retain duty-paid data. We provide the exact retrieval request + the fallback reconstruction path if their records are partial.',
  },
  {
    label: 'ACE self-export',
    summary:
      'You have (or can get) CBP ACE Portal access. That’s the fastest path.',
    detail:
      'A walkthrough of the exact ACE export screens, a CSV template to drop the export into, and — if you get stuck — an analyst screen-share.',
  },
] as const

interface StageRow {
  readonly sku: 'recovery_kit' | 'recovery_service'
  readonly label: string
  readonly summary: string
}

const ROWS: readonly StageRow[] = [
  {
    sku: 'recovery_kit',
    label: 'Recovery Kit — DIY',
    summary:
      'Outreach templates for your broker, carrier, or ACE export, plus the secure upload portal. You drive; we hand you the play.',
  },
  {
    sku: 'recovery_service',
    label: 'Recovery Service — we extract',
    summary:
      'You upload whatever you have. An analyst extracts and verifies entries directly from your documents and produces the validated list.',
  },
] as const

export default function RecoveryPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Stage 01</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Rebuild your entry list.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          Every broker, every carrier, every ACE account your
          shipments touched — reconciled into one provenance-checked
          record. The end state is a list your filing prep can stand on.
        </p>
        <div className="mt-12">
          <Button as="a" href="/screener" variant="solid" size="lg">
            Check eligibility
          </Button>
        </div>
      </header>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <p className="font-display text-2xl leading-relaxed text-ink sm:text-3xl">
            Most importers can&apos;t file because their entries live
            in three places at once — a broker portal, a freight
            invoice, an ACE account nobody logs into. The data is
            recoverable; it just takes a deliberate outreach workflow.
          </p>
        </div>
      </section>

      <Hairline label="Recovery paths" />

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-10 sm:py-32">
          <ol className="grid gap-8 sm:grid-cols-3">
            {PATHS.map((p) => (
              <li
                key={p.label}
                className="flex flex-col rounded-card border border-rule bg-paper-2 p-8"
              >
                <Eyebrow>{p.label}</Eyebrow>
                <p className="mt-4 font-display text-xl tracking-display text-ink">
                  {p.summary}
                </p>
                <p className="mt-6 text-base text-ink/80">{p.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Hairline label="Pricing" />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Stage 01 pricing</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Two ways to run Recovery.
          </h2>

          <div className="mt-12 divide-y divide-rule border-y border-rule">
            {ROWS.map((row) => {
              const smb = priceFor(row.sku, 'smb').usdCents
              const mid = priceFor(row.sku, 'mid_market').usdCents
              return (
                <div
                  key={row.sku}
                  data-sku={row.sku}
                  className="grid gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-12"
                >
                  <div>
                    <h3 className="font-display text-2xl text-ink">
                      {row.label}
                    </h3>
                    <p className="mt-3 text-base text-ink/75">{row.summary}</p>
                  </div>
                  <div
                    data-price-mono
                    className="font-mono text-lg text-accent sm:text-right"
                  >
                    {dollars(smb)} – {dollars(mid)}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-6 text-sm text-ink/65">
            Bands span SMB and mid-market. You land in mid-market when
            your case crosses 100 entries or{' '}
            <span className="font-mono">$50,000</span> in IEEPA duty paid.
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
                  'Build an outreach kit personalized to your specific path — broker, carrier, or ACE self-export.',
                  'Operate a secure upload portal that accepts 7501s, broker spreadsheets, carrier invoices, and ACE exports.',
                  'On the Service tier, an analyst extracts and verifies entries directly from your uploaded documents.',
                  'Track every entry to its source document so the provenance is auditable.',
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
                  'Use the outreach kit to ask your broker (or carrier) for the records you don’t already have.',
                  'Upload whatever you can find — even partial documents help.',
                  'Approve the recovered entry list before we move on.',
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
            A validated entry list with source-document provenance.
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
            The screener tells you which recovery path applies to you
            and what the likely refund looks like — before you pay a
            cent.
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
