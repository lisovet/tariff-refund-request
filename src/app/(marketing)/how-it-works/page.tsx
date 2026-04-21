import { Button, Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * /how-it-works — long-form editorial explainer per PRD 05. Three
 * stages, each as its own typeset movement with hairline rules
 * between sections (mirrors the homepage rhythm but goes deeper:
 * each stage has "What we do" and "What you do" sub-headings).
 *
 * Pricing copy here is editorial; canonical source is
 * src/contexts/billing/pricing.ts (lands in task #34) and is
 * snapshotted into /pricing in task #16.
 */

export const metadata = {
  title: 'How it works',
  description:
    'Three movements: recover your entry numbers, prepare a CAPE-ready file, hand off to concierge support if you need it.',
}

interface Stage {
  readonly num: '01' | '02' | '03'
  readonly title: 'Recovery' | 'Filing prep' | 'Concierge'
  readonly priceLabel: string
  readonly tagline: string
  readonly weDo: readonly string[]
  readonly youDo: readonly string[]
  readonly artifact: string
}

const STAGES: readonly Stage[] = [
  {
    num: '01',
    title: 'Recovery',
    priceLabel: '$99 — $499',
    tagline:
      'You may not know which entries you paid IEEPA on. We help you find them.',
    weDo: [
      'Build a personalized outreach kit for your specific path — broker, carrier, or ACE self-export.',
      'Walk you through a secure upload portal that accepts 7501s, broker spreadsheets, carrier invoices, and ACE CSVs.',
      'On the Service tier, an analyst extracts and verifies entries directly from your uploaded documents.',
      'Track every entry to its source document so the provenance is auditable.',
    ],
    youDo: [
      'Use the outreach kit to ask your broker (or carrier) for the records you do not already have.',
      'Upload whatever you can find — even partial documents help.',
      'Approve the recovered entry list before we move on.',
    ],
    artifact: 'A validated entry list with source-document provenance.',
  },
  {
    num: '02',
    title: 'Filing prep',
    priceLabel: '$199 — $999',
    tagline:
      'A CBP-compliant CAPE file plus a Readiness Report your broker can submit without changes.',
    weDo: [
      'Run the entry list through the CAPE validator: format checks, dedupe, phase segmentation, batch grouping.',
      'Generate a CBP-compliant CSV.',
      'Draft a Readiness Report — entries, prerequisite checks, blocking issues if any, recommended remediations.',
      'A validator (real human) signs off on the report before it reaches you.',
    ],
    youDo: [
      'Review the Readiness Report and download the CSV.',
      'Submit yourself, hand off to your existing broker, or upgrade to Concierge.',
    ],
    artifact: 'CSV + Readiness Report PDF, both human-reviewed.',
  },
  {
    num: '03',
    title: 'Concierge',
    priceLabel: '$999+ + 8–12% success fee',
    tagline: 'For when you would rather hand the rest off.',
    weDo: [
      'Coordinate the actual filing with you or your broker.',
      'Handle ACE / ACH prerequisite gaps with a clear remediation plan.',
      'Monitor CBP status weekly until the refund posts.',
      'Invoice the success fee against the realized refund — never against the estimate.',
    ],
    youDo: [
      'Sign the engagement letter (e-sign, before any payment is captured).',
      'Approve the final batch and the filing actor (you, your broker, or our partner network).',
      'Confirm receipt when the refund posts.',
    ],
    artifact: 'A filed claim, monitored to refund.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>How it works</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Three movements, paid in stages.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          You can stop at any stage. Each one delivers a concrete
          artifact — not a promise. The last stage is optional.
        </p>
      </header>

      <Hairline />

      {STAGES.map((stage, index) => (
        <section key={stage.num} className="bg-paper">
          <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
            <Eyebrow>Stage {stage.num}</Eyebrow>
            <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
              {stage.num} — {stage.title}
            </h2>
            <p className="mt-4 font-mono text-sm text-accent">
              {stage.priceLabel}
            </p>
            <p className="mt-8 max-w-2xl text-xl text-ink/85">
              {stage.tagline}
            </p>

            <div className="mt-16 grid gap-12 sm:grid-cols-2">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  What we do
                </h3>
                <ul className="mt-4 space-y-3 text-base text-ink/85">
                  {stage.weDo.map((line) => (
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
                  {stage.youDo.map((line) => (
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
              {stage.artifact}
            </p>
          </div>
          {index < STAGES.length - 1 && <Hairline label={`II · Stage ${index + 2}`} />}
        </section>
      ))}

      <section className="bg-paper-2">
        <Hairline />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10 sm:py-32">
          <h2 className="font-display text-4xl tracking-display text-ink sm:text-5xl">
            Ready when you are.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            The screener takes about three minutes. No account required
            until you see your results.
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
