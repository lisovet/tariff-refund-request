import { Button } from '@/app/_components/ui'

/**
 * Editorial hero per PRD 05 hierarchy + docs/DESIGN-LANGUAGE.md.
 *
 * - GT Sectra display (fallback chain) at masthead scale.
 * - Sentence-cased subhead in body sans.
 * - Magazine-underline CTA — exactly one accent element above the fold.
 * - No animation here beyond the CTA's underline-extend hover. The
 *   restraint is the point: the headline carries the page.
 *
 * The full-bleed documentary photograph called out in PRD 05 is
 * intentionally omitted — placeholder imagery would dilute the moment.
 * Photography lands once licensed (TODO(human-action)).
 */

export function HomeHero() {
  return (
    <header className="bg-paper">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32 sm:px-10 sm:pb-32 sm:pt-40">
        <h1 className="font-display text-5xl tracking-display text-ink sm:text-7xl">
          You may be owed an IEEPA tariff refund.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80 sm:text-xl">
          We help you find your entry numbers and prepare a CAPE-ready
          file. Built for importers, not trade experts. The first paid
          step costs <span className="font-mono">$99</span>.
        </p>
        <div className="mt-12">
          <Button as="a" href="/screener" variant="underline" size="lg">
            Check eligibility
          </Button>
        </div>
      </div>
    </header>
  )
}
