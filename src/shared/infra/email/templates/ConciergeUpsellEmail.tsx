import { Section } from '@react-email/components'
import { EmailLayout } from './_layout'
import { H1, P, PrimaryCta, greetingFor } from './_components'

/**
 * Lifecycle #8 per PRD 05: Concierge upsell — sent at the moment of
 * need, after Filing Prep is ready. Plain-language framing of what
 * Concierge actually does + the success-fee mechanic.
 */

interface Props {
  readonly firstName?: string
  readonly conciergePurchaseUrl: string
}

export function ConciergeUpsellEmail({
  firstName,
  conciergePurchaseUrl,
}: Props) {
  return (
    <EmailLayout preview="Concierge: we handle the rest.">
      <Section>
        <H1>Hand off the rest.</H1>
        <P>{greetingFor(firstName)}</P>
        <P>
          Concierge is the per-case high-touch tier. We coordinate the
          filing actor (your broker, your team, or our partner network),
          remediate ACE / ACH gaps with a clear plan, and monitor CBP
          status weekly until the refund posts.
        </P>
        <P>
          Pricing: a fixed engagement fee plus an 8&ndash;12% success
          fee on the realized refund. Invoiced against the actual
          refund — never against the estimate. Engagement letter
          e-signed before any payment is captured.
        </P>
        <PrimaryCta
          href={conciergePurchaseUrl}
          label="Read the Concierge engagement letter →"
        />
      </Section>
    </EmailLayout>
  )
}
