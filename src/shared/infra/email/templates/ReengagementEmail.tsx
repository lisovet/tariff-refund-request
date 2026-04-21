import { Section } from '@react-email/components'
import { EmailLayout } from './_layout'
import { H1, P, PrimaryCta, greetingFor } from './_components'

/**
 * Lifecycle #9 per PRD 05: day-14 re-engagement for stalled cases.
 * Soft re-entry — no pressure, just a reminder of where you left off.
 */

interface Props {
  readonly firstName?: string
  readonly caseUrl: string
}

export function ReengagementEmail({ firstName, caseUrl }: Props) {
  return (
    <EmailLayout preview="Picking up where you left off.">
      <Section>
        <H1>Picking up where you left off.</H1>
        <P>{greetingFor(firstName)}</P>
        <P>
          A couple of weeks ago you started this. The case is still
          here, your uploads are still here, and the next step is the
          same — a small one. The rest of this is mechanical once
          we&apos;re past it.
        </P>
        <P>
          If your situation changed and the refund isn&apos;t worth
          the lift right now, that&apos;s OK too. We don&apos;t
          re-charge or auto-renew anything; the case stays in your
          account either way.
        </P>
        <PrimaryCta href={caseUrl} label="Open the case →" />
      </Section>
    </EmailLayout>
  )
}
