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
 * Lifecycle #5 per PRD 05: 96h post-recovery, no documents — helpful
 * follow-up plus an offer of a 15-minute call. Tone is operational
 * and unembarrassed.
 */

interface Props {
  readonly firstName?: string
  readonly caseUrl: string
  readonly scheduleCallUrl: string
}

export function RecoveryMissingDocsEmail({
  firstName,
  caseUrl,
  scheduleCallUrl,
}: Props) {
  return (
    <EmailLayout preview="A quick check-in on your Recovery uploads.">
      <Section>
        <H1>Stuck on the uploads? That&apos;s normal.</H1>
        <P>{greetingFor(firstName)}</P>
        <P>
          We&apos;re still waiting on documents in your Recovery
          workspace. The most common blocker is the broker side — they
          take a couple of days to reply, sometimes longer. If you
          haven&apos;t sent the outreach email yet, that&apos;s the
          one task to do today.
        </P>
        <P>
          If something else is in the way, we can do a 15-minute
          working call: you screen-share your inbox, we point at the
          attachments, and you&apos;re unstuck.
        </P>
        <PrimaryCta href={caseUrl} label="Open my workspace →" />
        <P size="sm" muted>
          Prefer the call?{' '}
          <SecondaryLink href={scheduleCallUrl} label="Pick a 15-minute slot." />
        </P>
      </Section>
    </EmailLayout>
  )
}
