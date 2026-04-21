import { HomeDeliverables } from './_components/HomeDeliverables'
import { HomeHero } from './_components/HomeHero'
import { HomeMovements } from './_components/HomeMovements'
import { HomeProof } from './_components/HomeProof'
import { HomePullQuote } from './_components/HomePullQuote'

/**
 * Homepage composition.
 *
 *   Hero          — active promise + two CTAs.
 *   Proof         — one-paragraph print-article opener.
 *   Movements     — the three paid stages.
 *   Deliverables  — what lands in your inbox (concrete artifacts).
 *   Pull quote    — the canonical 4-clause trust promise (verbatim).
 *
 * The earlier "What we are not" negation list moved off the homepage
 * on the marketing rewrite. Negation belongs on /trust, not the
 * front door; the homepage earns attention by showing what the
 * customer receives, not by leading with disclaimers.
 */

export const metadata = {
  title: 'Get back the IEEPA tariffs you overpaid',
  description:
    'U.S. importers who paid IEEPA duties may be owed a refund. We reconstruct the entry list from brokers, carriers, and ACE, validate every line, and hand you a submission-ready refund package.',
}

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <HomeProof />
      <HomeMovements />
      <HomeDeliverables />
      <HomePullQuote />
    </main>
  )
}
