import { Section } from '@react-email/components'
import { EmailLayout } from './_layout'
import { H1, P, PrimaryCta, greetingFor } from './_components'

/**
 * Lifecycle #6 per PRD 05: Entry list ready. Restrained celebration;
 * points at Filing prep as the obvious next step.
 */

interface Props {
  readonly firstName?: string
  readonly caseUrl: string
  readonly entryCount: number
}

export function EntryListReadyEmail({
  firstName,
  caseUrl,
  entryCount,
}: Props) {
  return (
    <EmailLayout preview={`Entry list ready — ${entryCount} entries validated.`}>
      <Section>
        <H1>Entry list is ready.</H1>
        <P>{greetingFor(firstName)}</P>
        <P>
          We validated <strong>{entryCount}</strong> entries against
          your uploaded records. Each one has source-document
          provenance, so when you (or your broker) submit, the audit
          trail holds.
        </P>
        <P>
          The next step is Filing Prep: we run the entry list through
          the CAPE validator, generate a CBP-compliant CSV, and produce
          a Readiness Report a real person signs off on before it
          reaches you.
        </P>
        <PrimaryCta href={caseUrl} label="Review the entry list →" />
      </Section>
    </EmailLayout>
  )
}
