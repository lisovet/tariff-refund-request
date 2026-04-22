import { Button, Heading, Section, Text } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_FONTS, EmailLayout } from './_layout'

/**
 * 24h post-screener nudge per PRD 05.
 *
 * Editorial register: a soft nudge, not a sales push. Frames recovery
 * as the first concrete step. One link back to the results dossier;
 * one link to /how-it-works for evaluators.
 */

interface Props {
  readonly firstName?: string
  readonly resultsUrl: string
  readonly howItWorksUrl: string
}

export function ScreenerNudge24hEmail({
  firstName,
  resultsUrl,
  howItWorksUrl,
}: Props) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
  return (
    <EmailLayout preview="Your next step: recover your entry numbers.">
      <Section>
        <Heading
          as="h1"
          style={{
            margin: '0 0 24px',
            fontFamily: EMAIL_FONTS.display,
            fontSize: '28px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: EMAIL_COLORS.ink,
          }}
        >
          The shortest path to a refund is finding your entry numbers.
        </Heading>

        <Text
          style={{
            margin: '0 0 16px',
            fontSize: '16px',
            lineHeight: 1.6,
            color: EMAIL_COLORS.ink,
          }}
        >
          {greeting}
        </Text>

        <Text
          style={{
            margin: '0 0 16px',
            fontSize: '16px',
            lineHeight: 1.6,
            color: EMAIL_COLORS.ink,
          }}
        >
          Most importers can&apos;t file because they don&apos;t have a
          clean entry list. That&apos;s the work the Recovery step does
          first — broker outreach templates, an upload portal, optional
          analyst help. It costs less than the round trip to a CPA.
        </Text>

        <Section style={{ margin: '32px 0' }}>
          <Button
            href={resultsUrl}
            style={{
              display: 'inline-block',
              padding: '14px 24px',
              backgroundColor: EMAIL_COLORS.ink,
              color: EMAIL_COLORS.paper,
              fontFamily: EMAIL_FONTS.body,
              fontSize: '15px',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            See my results →
          </Button>
        </Section>

        <Text
          style={{
            margin: 0,
            fontSize: '14px',
            color: EMAIL_COLORS.ink60,
          }}
        >
          New here? Read{' '}
          <a
            href={howItWorksUrl}
            style={{
              color: EMAIL_COLORS.accent,
              textDecoration: 'underline',
            }}
          >
            how it works
          </a>
          .
        </Text>
      </Section>
    </EmailLayout>
  )
}
