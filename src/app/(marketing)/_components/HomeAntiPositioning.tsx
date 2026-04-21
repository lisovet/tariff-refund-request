import { Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * "What we are not" — the anti-positioning section per PRD 05.
 * The trust signal: we tell visitors what we explicitly do NOT do
 * before they ask.
 *
 * Per .claude/rules/never-auto-submit.md + disclosure-language-required.md:
 * the no-auto-submit promise must appear here as real text.
 */

const NON_GOALS: readonly string[] = [
  'A customs broker (unless explicitly noted in your engagement letter).',
  'A law firm. Nothing here is legal advice.',
  'An auto-submit-to-CBP service. You (or your broker) control the filing.',
  'A financing product. We do not advance refunds.',
  'A generic customs SaaS suite. We do one thing — IEEPA refund prep.',
  'An AI black box. Every artifact is reviewed by a real person before it reaches you.',
]

export function HomeAntiPositioning() {
  return (
    <section className="bg-paper-2">
      <Hairline />
      <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
        <Eyebrow>Plain English</Eyebrow>
        <h2 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
          What we are not.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-ink/80">
          The most useful thing we can tell you up-front is what this
          service does not do. If you need any of these, we will say so
          and point you somewhere honest.
        </p>

        <ul className="mt-12 divide-y divide-rule border-y border-rule">
          {NON_GOALS.map((line) => (
            <li
              key={line}
              className="flex items-baseline gap-4 py-5 text-base text-ink"
            >
              <span aria-hidden="true" className="font-mono text-accent">
                —
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <Hairline />
    </section>
  )
}
