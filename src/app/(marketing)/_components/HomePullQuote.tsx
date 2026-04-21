import { Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * Pull-quote per PRD 05. Hairline rule above (print-article style).
 * Until we have a real customer / partner reference, render the
 * canonical trust promise here as the editorial close before the
 * footer — so the page never bottoms out on a generic SaaS testimonial
 * placeholder.
 *
 * Once a real reference lands, swap the body copy + attribution
 * (single-source change in this component).
 */

export function HomePullQuote() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
        <Hairline label="The promise" />
        <blockquote className="mt-12 font-display text-3xl leading-snug text-ink sm:text-4xl">
          We help prepare your refund file. We do not guarantee CBP will
          approve it. We do not provide legal advice in this product.
          Every artifact you receive has been reviewed by a real person
          before it reaches you.
        </blockquote>
        <Eyebrow className="mt-8 block">Canonical trust posture</Eyebrow>
      </div>
    </section>
  )
}
