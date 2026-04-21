import { Section } from '@react-email/components'
import { EmailLayout } from './_layout'
import {
  H1,
  P,
  PrimaryCta,
  SecondaryLink,
  greetingFor,
} from './_components'

/**
 * Lifecycle #7 per PRD 05: Filing Prep ready. Delivers the Readiness
 * Report; offers Concierge as the optional next step.
 */

interface Props {
  readonly firstName?: string
  readonly readinessReportUrl: string
  readonly conciergeUpgradeUrl: string
}

export function PrepReadyEmail({
  firstName,
  readinessReportUrl,
  conciergeUpgradeUrl,
}: Props) {
  return (
    <EmailLayout preview="Your Readiness Report is signed and ready.">
      <Section>
        <H1>Your Readiness Report is signed and ready.</H1>
        <P>{greetingFor(firstName)}</P>
        <P>
          A validator reviewed every entry, ran the CAPE format
          checks, and signed off on the Readiness Report. The CSV is
          attached to your case workspace alongside the report.
        </P>
        <P>
          You can submit yourself, hand off to your existing broker,
          or upgrade to Concierge — we coordinate the filing,
          handle ACE / ACH gaps, and follow up with CBP until the
          refund posts.
        </P>
        <PrimaryCta
          href={readinessReportUrl}
          label="Open the Readiness Report →"
        />
        <P size="sm" muted>
          Want us to handle the rest?{' '}
          <SecondaryLink
            href={conciergeUpgradeUrl}
            label="See Concierge."
          />
        </P>
      </Section>
    </EmailLayout>
  )
}
