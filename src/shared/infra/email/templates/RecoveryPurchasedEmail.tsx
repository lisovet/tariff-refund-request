import { Section } from '@react-email/components'
import { EmailLayout } from './_layout'
import { H1, P, PrimaryCta, greetingFor } from './_components'

/**
 * Lifecycle #4 per PRD 05: Recovery purchased — welcome, what to
 * expect, the first task. Editorial register: warm but operational.
 */

interface Props {
  readonly firstName?: string
  readonly caseUrl: string
}

export function RecoveryPurchasedEmail({ firstName, caseUrl }: Props) {
  return (
    <EmailLayout preview="Your Recovery workspace is open.">
      <Section>
        <H1>Your Recovery workspace is open.</H1>
        <P>{greetingFor(firstName)}</P>
        <P>
          Your Recovery purchase is confirmed. The workspace is the
          single place we&apos;ll do this together: a personalized
          outreach kit, a checklist of what we need from your records,
          and a secure upload portal.
        </P>
        <P>
          The first task takes about ten minutes — copy the outreach
          email we drafted for you and send it to your broker (or
          export from ACE if you went that route). After that, we
          take it from there.
        </P>
        <PrimaryCta href={caseUrl} label="Open my workspace →" />
      </Section>
    </EmailLayout>
  )
}
