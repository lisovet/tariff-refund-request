import { Hairline } from '@/app/_components/ui'

/**
 * Proof statement per PRD 05. One paragraph in serif, set like a
 * print-article opener. Hairline rules above + below frame it as a
 * section break, not a SaaS "value prop" tile.
 */

export function HomeProof() {
  return (
    <section className="bg-paper">
      <Hairline />
      <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
        <p className="font-display text-2xl leading-relaxed text-ink sm:text-3xl">
          Most importers can&apos;t file because their entries live in
          three places at once — a broker portal, a freight invoice,
          an ACE account nobody logs into. The data is recoverable; it
          just takes a deliberate outreach workflow. That&apos;s the
          product.
        </p>
      </div>
      <Hairline />
    </section>
  )
}
