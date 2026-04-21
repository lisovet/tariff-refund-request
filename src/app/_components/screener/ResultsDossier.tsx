import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import type {
  Confidence,
  Prerequisites,
  RecommendedNextStep,
  ScreenerResult,
} from '@contexts/screener'

/**
 * Editorial results dossier per PRD 01 + docs/DESIGN-LANGUAGE.md.
 * The single canonical surface that renders a ScreenerResult — used
 * inline at /screener after q10 and at /screener/results?token= when
 * resumed from the magic-link email.
 *
 * Photographable: a founder should want to screenshot it. Hero metric
 * in Berkeley Mono at display size; confidence as a small caps accent
 * label; prerequisites as a typeset checklist; one CTA, sized for
 * confidence not aggression.
 */

interface Props {
  readonly result: ScreenerResult
  /** When true, surfaces the "we also sent these to your inbox" footnote. */
  readonly emailSent?: boolean
}

export function ResultsDossier({ result, emailSent = false }: Props) {
  if (result.qualification === 'disqualified') {
    return <DisqualifiedDossier result={result} />
  }
  return <QualifiedDossier result={result} emailSent={emailSent} />
}

function QualifiedDossier({
  result,
  emailSent,
}: {
  readonly result: ScreenerResult
  readonly emailSent: boolean
}) {
  return (
    <article>
      <Eyebrow>Your screener results</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
        {verdictFor(result)}
      </h1>

      {result.refundEstimate && (
        <section className="mt-12">
          <Eyebrow>Estimated refund range</Eyebrow>
          <p className="mt-3 font-mono text-4xl text-ink sm:text-6xl">
            ${result.refundEstimate.low.toLocaleString()} —{' '}
            ${result.refundEstimate.high.toLocaleString()}
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Confidence: {result.refundEstimate.confidence.toUpperCase()}
          </p>
        </section>
      )}

      <Hairline className="my-12" />

      <section>
        <Eyebrow>Filing readiness</Eyebrow>
        <PrerequisitesList prerequisites={result.prerequisites} />
      </section>

      <Hairline className="my-12" />

      <section>
        <Eyebrow>Recommended next step</Eyebrow>
        <p className="mt-3 font-mono text-sm text-accent">
          {nextStepLabel(result.recommendedNextStep)}
        </p>
        <p className="mt-6 max-w-xl text-base text-ink/85">
          {nextStepRationale(result.recommendedNextStep)}
        </p>
        <div className="mt-8">
          <Button as="a" href="/how-it-works" variant="underline" size="lg">
            See how each stage works
          </Button>
        </div>
      </section>

      {emailSent && (
        <p className="mt-12 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          We also sent these results to your inbox.
        </p>
      )}
    </article>
  )
}

function DisqualifiedDossier({ result }: { readonly result: ScreenerResult }) {
  return (
    <article>
      <Eyebrow>Your screener results</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
        Probably not a fit right now.
      </h1>
      <p className="mt-8 text-lg text-ink/85">
        Based on your answers we don&apos;t see an obvious IEEPA refund
        here. If your situation changes — say, you become the Importer
        of Record on a new lane, or your records turn up old IEEPA-window
        entries — we&apos;d like to let you know.
      </p>
      <p className="mt-4 text-sm text-ink/60">
        Reason:{' '}
        <span className="font-mono">{result.disqualificationReason}</span>
      </p>

      <Hairline className="my-12" />

      <p className="text-sm text-ink/70">
        We send updates only when something genuinely changes — typically
        once or twice a year. You can{' '}
        <a
          href="/how-it-works"
          className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
        >
          read how the service works
        </a>{' '}
        if you&apos;re evaluating it for someone else.
      </p>
    </article>
  )
}

// --- subcomponents --------------------------------------------------------

const PREREQUISITE_ROWS: ReadonlyArray<{
  readonly key: keyof Prerequisites
  readonly label: string
}> = [
  { key: 'ior', label: 'Importer of record' },
  { key: 'ace', label: 'ACE access' },
  { key: 'ach', label: 'ACH on file' },
  { key: 'liquidationKnown', label: 'Liquidation status known' },
]

function PrerequisitesList({
  prerequisites,
}: {
  readonly prerequisites: Prerequisites
}) {
  return (
    <ul className="mt-4 divide-y divide-rule border-y border-rule">
      {PREREQUISITE_ROWS.map((row) => (
        <li
          key={row.key}
          className="flex items-baseline justify-between gap-4 py-3 text-base text-ink"
        >
          <span>{row.label}</span>
          <span
            className={`font-mono text-xs uppercase tracking-[0.2em] ${
              prerequisites[row.key] ? 'text-positive' : 'text-warning'
            }`}
            aria-label={prerequisites[row.key] ? 'Met' : 'Missing'}
          >
            {prerequisites[row.key] ? 'Met' : 'Missing'}
          </span>
        </li>
      ))}
    </ul>
  )
}

// --- copy helpers ---------------------------------------------------------

function verdictFor(result: ScreenerResult): string {
  if (result.qualification === 'qualified') return 'Likely a fit.'
  return 'Probably worth a closer look.'
}

const NEXT_STEP_LABEL: Record<RecommendedNextStep, string> = {
  recovery_kit: 'Recovery Kit · $99–299',
  recovery_service: 'Recovery Service · $299–499',
  cape_prep: 'CAPE Filing Prep · $199–999',
  concierge: 'Concierge · $999+ + 8–12% success fee',
  none: '—',
}

const NEXT_STEP_RATIONALE: Record<RecommendedNextStep, string> = {
  recovery_kit:
    'Self-guided outreach kit + secure upload portal. Fastest path when your duty exposure is on the smaller side.',
  recovery_service:
    'Adds an analyst who extracts and verifies entries directly from your uploaded documents — the right call when records are fragmented.',
  cape_prep:
    'Once your entries are validated, generate a CBP-compliant CSV plus a human-reviewed Readiness Report.',
  concierge:
    'High-touch coordination of filing actor, ACE/ACH gaps, and CBP follow-up. Recommended at scale or with mixed clearance paths.',
  none: '',
}

function nextStepLabel(step: RecommendedNextStep): string {
  return NEXT_STEP_LABEL[step]
}

function nextStepRationale(step: RecommendedNextStep): string {
  return NEXT_STEP_RATIONALE[step]
}

// Re-export for use by tests against the verdict / label maps if needed.
export { verdictFor as _verdictFor, NEXT_STEP_LABEL as _NEXT_STEP_LABEL }

// Confidence type re-exported so consumers don't have to chase it
// through the screener context just to type a wrapper.
export type { Confidence }
