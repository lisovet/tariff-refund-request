import { HomeAntiPositioning } from './_components/HomeAntiPositioning'
import { HomeHero } from './_components/HomeHero'
import { HomeMovements } from './_components/HomeMovements'
import { HomeProof } from './_components/HomeProof'
import { HomePullQuote } from './_components/HomePullQuote'

/**
 * Homepage — composes the editorial sections per PRD 05 hierarchy.
 *
 * SiteFooter renders from the marketing layout, not here.
 *
 * Per docs/DESIGN-LANGUAGE.md, this is the moment we either earn or
 * lose taste credit. Restraint is intentional: ink-on-paper, GT Sectra
 * display (fallback chain until licensed), one accent CTA above the
 * fold, hairline rules between sections, real footnotes in the footer.
 */

export const metadata = {
  title: 'IEEPA Refund Audit & CAPE Filing Prep',
  description:
    'You may be owed an IEEPA tariff refund. We help you find your entry numbers and prepare a CAPE-ready file.',
}

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <HomeProof />
      <HomeMovements />
      <HomeAntiPositioning />
      <HomePullQuote />
    </main>
  )
}
