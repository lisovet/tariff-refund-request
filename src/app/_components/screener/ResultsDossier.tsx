import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import type {
  Confidence,
  DisqualificationReason,
  Prerequisites,
  RecommendedNextStep,
  ScreenerResult,
} from '@contexts/screener'
import { NotifyMeForm } from './NotifyMeForm'
import { StartOverButton } from './StartOverButton'

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
  /**
   * Screener session id. On the disqualified path this lets us attach
   * a captured email to the originating session so we can reach the
   * user if eligibility rules change.
   */
  readonly sessionId?: string | null
}

export function ResultsDossier({
  result,
  emailSent = false,
  sessionId = null,
}: Props) {
  if (result.qualification === 'disqualified') {
    return <DisqualifiedDossier result={result} sessionId={sessionId} />
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
        <div className="mt-8 flex flex-wrap items-baseline gap-6">
          <Button
            as="a"
            href={nextStepHref(result.recommendedNextStep)}
            variant="underline"
            size="lg"
          >
            See your options
          </Button>
          <a
            href="/how-it-works"
            className="text-sm text-accent/80 underline underline-offset-[6px] decoration-accent/30 hover:decoration-accent decoration-1"
          >
            How each stage works
          </a>
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

function DisqualifiedDossier({
  result,
  sessionId,
}: {
  readonly result: ScreenerResult
  readonly sessionId: string | null
}) {
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
      <p className="mt-4 text-sm text-ink/70">
        {disqualificationCopy(result.disqualificationReason)}
      </p>

      <section className="mt-10">
        <Eyebrow>Stay in the loop</Eyebrow>
        <p className="mt-3 text-sm text-ink/75">
          Drop your email and we&apos;ll reach out if eligibility changes
          or the service expands to your situation. Updates only when
          something genuinely changes — typically once or twice a year.
        </p>
        <div className="mt-6">
          <NotifyMeForm sessionId={sessionId} />
        </div>
      </section>

      <Hairline className="my-12" />

      <div className="flex flex-wrap items-baseline gap-6">
        <StartOverButton />
        <a
          href="/how-it-works"
          className="text-sm text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
        >
          Read how the service works
        </a>
      </div>
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

const NEXT_STEP_HREF: Record<RecommendedNextStep, string> = {
  recovery_kit: '/pricing#recovery',
  recovery_service: '/pricing#recovery',
  cape_prep: '/pricing#prep',
  concierge: '/pricing#concierge',
  none: '/pricing',
}

function nextStepHref(step: RecommendedNextStep): string {
  return NEXT_STEP_HREF[step]
}

const DISQUALIFICATION_COPY: Record<DisqualificationReason, string> = {
  no_imports_in_window:
    'Your imports fell outside the IEEPA refund window (Feb 4, 2025 – Feb 23, 2026).',
  not_ior:
    'Refunds can only be claimed by the Importer of Record on the entry.',
  unknown: "We weren't able to confirm eligibility from your answers.",
}

function disqualificationCopy(reason: DisqualificationReason | undefined): string {
  if (!reason) return DISQUALIFICATION_COPY.unknown
  return DISQUALIFICATION_COPY[reason]
}

// Re-export for use by tests against the verdict / label maps if needed.
export {
  verdictFor as _verdictFor,
  NEXT_STEP_LABEL as _NEXT_STEP_LABEL,
  NEXT_STEP_HREF as _NEXT_STEP_HREF,
  DISQUALIFICATION_COPY as _DISQUALIFICATION_COPY,
}

// Confidence type re-exported so consumers don't have to chase it
// through the screener context just to type a wrapper.
export type { Confidence }
