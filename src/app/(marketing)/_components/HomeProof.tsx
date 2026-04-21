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
          Most importers caught in the IEEPA window cannot file because
          their entry data is fragmented across brokers, carriers, and
          ACE accounts they have never used. We turn that mess into a
          submission-ready CAPE file with human review on every artifact.
        </p>
      </div>
      <Hairline />
    </section>
  )
}
