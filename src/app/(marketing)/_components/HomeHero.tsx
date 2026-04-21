import Link from 'next/link'
import { Button } from '@/app/_components/ui'

/**
 * Editorial hero per PRD 05 + docs/DESIGN-LANGUAGE.md.
 *
 * Lead with an active, specific promise — "Get back the tariffs
 * you overpaid" beats "You may be owed a refund" because
 * importers who paid IEEPA duties already know the stakes; they
 * need a plain-English hook, not another compliance briefing.
 *
 * Two CTAs: primary solid accent (screener path) + a quiet
 * secondary link to the long-form. Exactly one accent element
 * above the fold.
 */

export function HomeHero() {
  return (
    <header className="bg-paper">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-28 sm:px-10 sm:pb-32 sm:pt-40">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/60">
          IEEPA tariff refund service
        </p>
        <h1 className="mt-6 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Get back the tariffs you overpaid.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-ink/80 sm:text-xl">
          If you imported into the U.S. during the IEEPA tariff window,
          you may be owed a refund. The hard part is assembling every
          entry you made — from brokers, carriers, and ACE accounts
          that probably aren&apos;t yours. We reconstruct that
          package, validate every line, and hand it to you ready to
          file.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
          <Button as="a" href="/screener" variant="solid" size="lg">
            Check eligibility
          </Button>
          <Link
            href="/how-it-works"
            className="font-sans text-base text-ink/80 underline underline-offset-[6px] decoration-ink/30 hover:decoration-ink"
          >
            How it works →
          </Link>
        </div>
      </div>
    </header>
  )
}
