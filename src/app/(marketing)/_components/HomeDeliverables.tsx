import { Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * Concrete-deliverables section per the marketing rewrite.
 *
 * Replaces the earlier "What we are not" negation list on the
 * homepage. Negation belongs inside /trust, not on the front
 * door — the front door earns attention by showing what the
 * customer actually receives.
 *
 * Three items match the three v1 artifacts shipped by the
 * artifact-generation pipeline (task #70): the signed
 * Readiness Report PDF, the CBP-compliant CSV, and the
 * coordination log.
 */

interface Deliverable {
  readonly label: string
  readonly title: string
  readonly detail: string
}

const DELIVERABLES: readonly Deliverable[] = [
  {
    label: '.pdf',
    title: 'Readiness Report',
    detail:
      'Signed by the validator who reviewed your batch. Every entry, every prerequisite, every note — with a real-text disclosure footer. Your broker or counsel can forward it unchanged.',
  },
  {
    label: '.csv',
    title: 'CBP-compliant entry list',
    detail:
      'The CAPE-format columns, one row per entry, with canonical entry numbers, duty totals, phase flags, and source confidence. Drops straight into your broker’s filing tool.',
  },
  {
    label: 'log',
    title: 'Coordination trail',
    detail:
      'Every contact we made on your behalf — broker outreach, carrier requests, ACE queries — with timestamps, responses, and the state of every outstanding record.',
  },
]

export function HomeDeliverables() {
  return (
    <section className="bg-paper-2">
      <Hairline />
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <header className="max-w-2xl">
          <Eyebrow>What lands in your inbox</Eyebrow>
          <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
            Three artifacts, reviewed by a human before they reach you.
          </h2>
          <p className="mt-6 text-lg text-ink/75">
            The same package we&apos;d submit on your behalf — except
            you own it, and you choose who files.
          </p>
        </header>

        <dl className="mt-16 grid gap-10 sm:mt-20 sm:grid-cols-3">
          {DELIVERABLES.map((d) => (
            <div key={d.label} className="border-t border-ink pt-6">
              <dt>
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                  {d.label}
                </span>
                <p className="mt-3 font-display text-2xl tracking-display text-ink">
                  {d.title}
                </p>
              </dt>
              <dd className="mt-4 text-base text-ink/80">{d.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
