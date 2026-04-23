import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import { TIERS } from '@contexts/billing'
import {
  REFUND_TIMING_CLAUSE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@/shared/disclosure/constants'

/**
 * /how-it-works — long-form editorial explainer for the two-tier
 * commercial model. Four sections: the free screener (section 00),
 * Audit (01), Full Prep (02), and "After delivery" (03) which
 * carries the canonical trust disclosures.
 *
 * Copy that has a single source of truth — tier pitches and tier
 * numbers — is imported from `@contexts/billing` (TIERS) and
 * `@/shared/disclosure/constants`. Prose ("What we do / What you
 * do") is editorial, written for this page, intentionally not the
 * same bullets as the TIERS.included list (those are for pricing
 * cards).
 */

export const metadata = {
  title: 'How it works',
  description:
    "Two tiers. Start with the free screener, then pick Audit ($99) or Full Prep & Concierge Service ($999 + success fee). We prepare the file; you control submission.",
}

interface Section {
  readonly num: '00' | '01' | '02' | '03'
  readonly title: string
  readonly priceLabel: string
  readonly tagline: string
  readonly weDo: readonly string[]
  readonly youDo: readonly string[]
  /** Muted paragraph shown only on Audit — the upgrade wedge. */
  readonly doesNotInclude?: string
  /** Hairline-bordered aside shown only on Full Prep. */
  readonly turnaround?: string
  /** Sectra artifact callout — shown on sections 00 / 01 / 02. */
  readonly artifact?: string
  /**
   * When present, the section has no "we do / you do" columns and
   * renders prose + disclosures instead. Used by section 03.
   */
  readonly afterDeliveryProse?: {
    readonly body: string
    readonly disclosures: readonly string[]
  }
}

const SECTIONS: readonly Section[] = [
  {
    num: '00',
    title: 'The screener',
    priceLabel: 'Free · 10 questions · 3 minutes',
    tagline:
      'Ten questions about what you import and when. We tell you whether you qualify for Phase 1, Phase 2, or both, and a refund-range estimate grounded in your own numbers.',
    weDo: [
      'Run your answers through the CBP Phase 1 / Phase 2 eligibility rules so you see a verdict, not a pitch.',
      'Estimate the refund range from your stated duty volume and import dates.',
      'Recommend Audit or Full Prep & Concierge Service based on the paperwork burden your specific case implies.',
    ],
    youDo: [
      "Answer ten questions honestly. We don't store any personally identifiable account info before you decide to continue.",
      'Pick a tier, or close the tab — nothing is charged yet.',
    ],
    artifact:
      'A Phase 1 / Phase 2 verdict, a refund estimate, and a tier recommendation.',
  },
  {
    num: '01',
    title: 'Audit',
    priceLabel: '$99 · one-time',
    tagline: TIERS.audit.pitch,
    weDo: [
      "Issue a Phase 1 / Phase 2 eligibility verdict with a confidence level, so you know which window you're working against.",
      "Run a country-and-category analysis: which of your imports qualify, which don't, and why.",
      'Tighten the refund-range estimate using the country / category analysis, so the number you see is defensible.',
      'Hand you a personalized checklist of exactly what to gather and in what order.',
      'Include a pre-written broker outreach email template, an ACE portal setup guide with ACH enrollment walkthrough, and the CAPE CSV spec so you know the exact format your file needs to hit.',
    ],
    youDo: [
      'Request documents from your broker or carrier using our template.',
      'Enroll in ACE and set up ACH banking using our guide.',
      'Build the CAPE CSV to the spec we give you.',
      'Upload to ACE under your own account.',
    ],
    doesNotInclude:
      "We don't review your documents, extract entry numbers from them, build or validate the CSV, or produce a pre-submission confidence report. If that's the help you want, Full Prep & Concierge Service is the tier for you.",
    artifact:
      'An Audit packet — verdict, estimated refund range, personalized checklist, broker template, ACE guide, and CAPE CSV spec.',
  },
  {
    num: '02',
    title: 'Full Prep & Concierge Service',
    priceLabel:
      '$999 due now · 10 % of estimated refund, capped at $25,000 — billed after file delivery',
    tagline: TIERS.full_prep.pitch,
    weDo: [
      'Manage document collection end-to-end — we follow up with your broker or carrier directly until we have what we need.',
      'A validator reviews every document and extracts every entry number. Each entry carries a source + confidence record back to the document it came from.',
      'Build your full CAPE CSV — formatted, validated, split if the batch size requires it, and ready to upload.',
      'Separate Phase 1 from Phase 2: your Phase 1 file is ready now; we hold your Phase 2 entries and re-engage when that window opens.',
      "Deliver a pre-submission confidence report: a plain-English summary of what's in the file, any flags that could cause a CBP hold, and the expected timeline.",
      'Give you an ACE upload walkthrough so nothing goes wrong at submission.',
    ],
    youDo: [
      'Sign the engagement letter (e-sign, before any success fee is captured).',
      'Get us the documents we ask for — the exact list, based on your clearance path. Nothing speculative.',
      'Upload to ACE yourself, or hand the validated file to your broker.',
      'Confirm receipt when CBP posts the refund.',
    ],
    turnaround: 'Five business days from documents received to file delivered.',
    artifact:
      'A validated, submission-ready CAPE file + pre-submission confidence report, signed off by a named human validator.',
  },
  {
    num: '03',
    title: 'After delivery',
    priceLabel: 'What CBP does',
    tagline:
      'Once the file is delivered, submission is yours. You upload to ACE (or your broker does). CBP reviews on its own schedule — typically weeks to months — and posts the refund directly to your ACH account.',
    weDo: [],
    youDo: [],
    afterDeliveryProse: {
      body: "We stay reachable after delivery for questions about the file we built, but we never submit on your behalf and we don't chase CBP. That posture is deliberate — not a limitation.",
      disclosures: [SUBMISSION_CONTROL_CLAUSE, REFUND_TIMING_CLAUSE],
    },
  },
]

export default function HowItWorksPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>How it works</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Two tiers. Pick what you have time for.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          Everyone starts with the same free eligibility screener.
          Then you decide: do the work yourself with our Audit packet,
          or hand it to us and get a submission-ready file back in
          five business days.
        </p>
      </header>

      <Hairline />

      {SECTIONS.map((section, index) => (
        <section key={section.num} className="bg-paper">
          <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
            <Eyebrow>Section {section.num}</Eyebrow>
            <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
              {section.num} — {section.title}
            </h2>
            <p className="mt-4 font-mono text-sm text-accent">
              {section.priceLabel}
            </p>
            <p className="mt-8 max-w-2xl text-xl text-ink/85">
              {section.tagline}
            </p>

            {section.afterDeliveryProse ? (
              <div className="mt-12 max-w-2xl">
                <p className="text-base text-ink/80">
                  {section.afterDeliveryProse.body}
                </p>
                <ul className="mt-8 space-y-3 border-l border-rule pl-6">
                  {section.afterDeliveryProse.disclosures.map((line) => (
                    <li
                      key={line}
                      className="font-mono text-xs uppercase tracking-[0.2em] text-ink/70"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <div className="mt-16 grid gap-12 sm:grid-cols-2">
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                      What we do
                    </h3>
                    <ul className="mt-4 space-y-3 text-base text-ink/85">
                      {section.weDo.map((line) => (
                        <li key={line} className="flex items-baseline gap-3">
                          <span
                            aria-hidden="true"
                            className="font-mono text-accent"
                          >
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
                      {section.youDo.map((line) => (
                        <li key={line} className="flex items-baseline gap-3">
                          <span
                            aria-hidden="true"
                            className="font-mono text-accent"
                          >
                            →
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {section.doesNotInclude && (
                  <p className="mt-10 max-w-2xl text-sm text-ink/55">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
                      What this tier doesn&rsquo;t do
                    </span>
                    <br />
                    {section.doesNotInclude}
                  </p>
                )}

                {section.turnaround && (
                  <aside
                    aria-label="Full Prep & Concierge Service turnaround"
                    className="mt-10 border-l-2 border-accent pl-6"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                      Turnaround
                    </p>
                    <p className="mt-2 text-base text-ink/85">
                      {section.turnaround}
                    </p>
                  </aside>
                )}

                {section.artifact && (
                  <p className="mt-12 border-l border-rule pl-6 font-display text-2xl text-ink">
                    {section.artifact}
                  </p>
                )}
              </>
            )}
          </div>
          {index < SECTIONS.length - 1 && (
            <Hairline label={`Section ${SECTIONS[index + 1]!.num}`} />
          )}
        </section>
      ))}

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:px-10 sm:py-24">
          <aside
            aria-label="Audit credit toward Full Prep & Concierge Service"
            className="flex items-baseline gap-6 border-l-2 border-accent pl-6"
          >
            <span className="font-mono text-3xl text-accent sm:text-4xl">
              $99
            </span>
            <p className="text-lg text-ink/85 sm:text-xl">
              <span className="font-medium text-ink">
                Paid for the Audit first?
              </span>{' '}
              We credit the full $99 toward Full Prep & Concierge Service when you upgrade —
              no double-charging for the same eligibility work.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-paper-2">
        <Hairline />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10 sm:py-32">
          <h2 className="font-display text-4xl tracking-display text-ink sm:text-5xl">
            Start with the screener.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Ten questions. Three minutes. You&apos;ll see a refund
            estimate at the end — no account required.
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
