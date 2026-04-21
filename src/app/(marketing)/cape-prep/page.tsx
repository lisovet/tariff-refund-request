import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import { priceFor } from '@contexts/billing'
import { dollars } from '../_components/formatDollars'

/**
 * /cape-prep — Stage 02 deep-dive page per PRD 03 + PRD 05.
 *
 * Leads with the concrete artifact (a PDF + a CSV a broker can
 * file unchanged) and makes the validator-gate mechanic legible.
 */

export const metadata = {
  title: 'Filing prep',
  description:
    'Turn entries into a submission-ready package. CBP-compliant CSV. Signed Readiness Report. Your broker files it unchanged.',
}

interface Severity {
  readonly tag: 'blocking' | 'warning' | 'info'
  readonly label: string
  readonly detail: string
}

const SEVERITIES: readonly Severity[] = [
  {
    tag: 'blocking',
    label: 'Blocking',
    detail:
      'Missing IOR, invalid entry number, duplicate entry, entry outside the IEEPA window, or missing HTS on a duty-bearing entry. You cannot download the CSV until these clear.',
  },
  {
    tag: 'warning',
    label: 'Warning',
    detail:
      'Low-confidence source document, duty calculation near a band boundary. Validator reviews each one and decides whether to ship.',
  },
  {
    tag: 'info',
    label: 'Info',
    detail:
      'Non-blocking flags — batch size past the recommended threshold, ACH not on file. Surfaces on the Readiness Report so nothing is hidden.',
  },
] as const

interface StageRow {
  readonly sku: 'cape_prep_standard' | 'cape_prep_premium'
  readonly label: string
  readonly summary: string
}

const ROWS: readonly StageRow[] = [
  {
    sku: 'cape_prep_standard',
    label: 'CAPE Prep — Standard',
    summary:
      'Format checks, dedupe, batch grouping, Readiness Report draft. Reviewed by a named validator before it reaches you.',
  },
  {
    sku: 'cape_prep_premium',
    label: 'CAPE Prep — Premium',
    summary:
      'Everything in Standard plus phase segmentation, prerequisite-gap remediation plan, and senior-validator review.',
  },
] as const

export default function CapePrepPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Stage 02</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Turn entries into a file your broker can submit.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          A CBP-compliant CSV and a signed Readiness Report. Reviewed
          by a named validator before it reaches you. Your broker
          files it unchanged.
        </p>
        <div className="mt-12">
          <Button as="a" href="/screener" variant="solid" size="lg">
            Check eligibility
          </Button>
        </div>
      </header>

      <Hairline label="The Readiness Report" />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            One document your CFO, your broker, and CBP reviewer all
            read the same way.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Three pages max. Masthead with case id + customer + analyst
            + timestamp. A hero count of entries reviewed with
            blocking / warning / info badges. A typeset entry table
            with status glyphs and real footnotes for caveats. A
            prerequisite checklist — IOR, ACH, ACE — each marked met
            or missing. Analyst sign-off at the bottom. The canonical
            trust promise in the footer.
          </p>
          <p className="mt-6 text-base text-ink/70">
            The CSV is the CBP-compatible companion — one row per
            entry, every cell quoted, CRLF line endings, and a
            filename format your filing tool recognises.
          </p>
        </div>
      </section>

      <Hairline label="Validator gates" />

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>What the validator catches</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Three severity bands. Nothing hidden from you.
          </h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-3">
            {SEVERITIES.map((s) => (
              <li
                key={s.tag}
                className="flex flex-col rounded-card border border-rule bg-paper-2 p-8"
              >
                <span
                  className="font-mono text-xs uppercase tracking-[0.2em] text-accent"
                  data-severity={s.tag}
                >
                  {s.label}
                </span>
                <p className="mt-6 text-base text-ink/85">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Hairline label="Pricing" />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Stage 02 pricing</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Standard or Premium.
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
            Bands span SMB and mid-market. You land in mid-market at
            100+ entries or <span className="font-mono">$50,000</span>+
            in IEEPA duty paid.
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
                  'Run the entry list through the CAPE validator: format checks, dedupe, phase segmentation, batch grouping.',
                  'Generate a CBP-compliant CSV.',
                  'Draft the Readiness Report — entries, prerequisite checks, blocking issues if any, recommended remediations.',
                  'A validator (a real human, named on the artifact) signs off on the report before it reaches you.',
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
                  'Review the Readiness Report and download the CSV.',
                  'Submit yourself, hand off to your existing broker, or upgrade to Concierge.',
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
            CSV + Readiness Report PDF, both human-reviewed.
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
            Qualify first. You&apos;ll see what your refund looks like
            before you pay for filing prep.
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
