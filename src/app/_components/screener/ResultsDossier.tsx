import { Eyebrow, Hairline } from '@/app/_components/ui'
import type { TierId } from '@contexts/billing'
import type {
  Confidence,
  DisqualificationReason,
  Prerequisites,
  RecommendedNextStep,
  ScreenerResult,
} from '@contexts/screener'
import { NotifyMeForm } from './NotifyMeForm'
import { StartOverButton } from './StartOverButton'
import { TierSelection } from './TierSelection'

/**
 * Editorial results dossier per PRD 01 + docs/DESIGN-LANGUAGE.md.
 * The single canonical surface that renders a ScreenerResult — used
 * inline at /screener after q10 and at /screener/results?token= when
 * resumed from the magic-link email.
 *
 * The qualified surface is the funnel's highest-converting page:
 * verdict + refund hero + filing readiness + two-tier selection with
 * in-page Pay buttons that land on /screener/confirmation. There is
 * no longer any link back to /pricing from here — we broke the
 * circular loop by inlining the commercial decision.
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
  const recommendedTier = TIER_FOR_STEP[result.recommendedNextStep]
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
          <p className="mt-4 text-sm text-ink/60">
            Estimates are based on the information you provided. Actual
            refunds depend on CBP review.
          </p>
        </section>
      )}

      <Hairline className="my-12" />

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow>Filing readiness</Eyebrow>
          <ReadinessSummary prerequisites={result.prerequisites} />
        </div>
        <PrerequisitesList prerequisites={result.prerequisites} />
      </section>

      <Hairline className="my-12" />

      <TierSelection recommendedTier={recommendedTier} />

      <div className="mt-10">
        <a
          href="/how-it-works"
          className="text-sm text-accent/80 underline underline-offset-[6px] decoration-accent/30 hover:decoration-accent decoration-1"
        >
          How this works
        </a>
      </div>

      {emailSent && (
        <p className="mt-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
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
        Not a fit right now.
      </h1>
      <p className="mt-8 text-lg text-ink/85">
        Based on your answers, you don&apos;t appear to qualify for an
        IEEPA refund right now. If your situation changes — say, you
        become the Importer of Record on a new lane, or your records
        turn up old IEEPA-window entries — we&apos;d like to let you
        know.
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
  readonly missingCopy: string
}> = [
  {
    key: 'ior',
    label: 'Importer of record',
    missingCopy:
      "You aren't the Importer of Record — only the IOR can file this refund.",
  },
  {
    key: 'ace',
    label: 'ACE access',
    missingCopy:
      "You'll need an ACE portal account before CBP accepts the correction.",
  },
  {
    key: 'ach',
    label: 'ACH on file',
    missingCopy:
      'ACH on file is how CBP returns the money. Set this up first.',
  },
  {
    key: 'liquidationKnown',
    label: 'Liquidation status known',
    missingCopy:
      "Liquidation status determines your filing window. We'll help you confirm it.",
  },
]

function ReadinessSummary({
  prerequisites,
}: {
  readonly prerequisites: Prerequisites
}) {
  const total = PREREQUISITE_ROWS.length
  const ready = PREREQUISITE_ROWS.filter((r) => prerequisites[r.key]).length
  const allReady = ready === total
  return (
    <p
      className={`font-mono text-xs uppercase tracking-[0.2em] ${
        allReady ? 'text-positive' : 'text-blocking'
      }`}
      aria-label={`${ready} of ${total} items ready`}
    >
      {ready} / {total} ready
    </p>
  )
}

function PrerequisitesList({
  prerequisites,
}: {
  readonly prerequisites: Prerequisites
}) {
  return (
    <ul className="mt-6 divide-y divide-rule border-y border-rule">
      {PREREQUISITE_ROWS.map((row) => {
        const met = prerequisites[row.key]
        return (
          <li
            key={row.key}
            className={`flex items-start justify-between gap-6 py-5 ${
              met ? '' : 'border-l-4 border-l-blocking pl-4'
            }`}
          >
            <div className="flex-1">
              <p
                className={`text-base ${
                  met ? 'text-ink' : 'font-medium text-blocking'
                }`}
              >
                {row.label}
              </p>
              {!met && (
                <p className="mt-1 text-sm text-ink/70">{row.missingCopy}</p>
              )}
            </div>
            <span
              className={`flex shrink-0 items-center gap-2 font-mono uppercase tracking-[0.2em] ${
                met
                  ? 'text-xs text-positive'
                  : 'text-sm font-medium text-blocking'
              }`}
              aria-label={met ? 'Met' : 'Missing'}
            >
              <span aria-hidden="true" className={met ? 'text-sm' : 'text-lg leading-none'}>
                {met ? '✓' : '×'}
              </span>
              {met ? 'Met' : 'Missing'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// --- copy helpers ---------------------------------------------------------

function verdictFor(result: ScreenerResult): string {
  if (result.qualification === 'qualified') return 'Likely a fit.'
  return 'Likely worth a closer look.'
}

/**
 * Map from the screener's `RecommendedNextStep` union to the tier
 * card the results page highlights. The union already mirrors the
 * two-tier `TierId` surface (`'audit' | 'full_prep' | 'none'`); the
 * `'none'` branch only fires on the DQ path, which renders a
 * different dossier variant entirely. Default non-DQ leads here to
 * the Audit recommendation (lower-friction entry point).
 */
const TIER_FOR_STEP: Record<RecommendedNextStep, TierId> = {
  audit: 'audit',
  full_prep: 'full_prep',
  none: 'audit',
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

// Re-export for tests.
export {
  verdictFor as _verdictFor,
  TIER_FOR_STEP as _TIER_FOR_STEP,
  DISQUALIFICATION_COPY as _DISQUALIFICATION_COPY,
}

// Confidence type re-exported so consumers don't have to chase it
// through the screener context just to type a wrapper.
export type { Confidence }
