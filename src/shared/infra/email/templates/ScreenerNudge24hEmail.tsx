import { Button, Heading, Section, Text } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_FONTS, EmailLayout } from './_layout'

/**
 * 24h post-screener nudge per PRD 05.
 *
 * Editorial register: a soft nudge, not a sales push. Frames the
 * Audit as the low-commitment first step in the two-tier model. One
 * link back to the results dossier; one link to /how-it-works for
 * evaluators still deciding between Audit and Full Prep.
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
    <EmailLayout preview="Your next step: a $99 Audit with a clear verdict and a checklist.">
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
          The shortest path to a refund starts with a clear verdict.
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
          Most importers stall because they aren&apos;t sure which of
          their entries qualify, or what to ask their broker for. The
          $99 Audit gives you an eligibility verdict, a defensible
          refund estimate, and a step-by-step checklist with the
          templates you need — so you can run the rest yourself, or
          hand it to us for Full Prep. If you upgrade, the $99 credits
          toward Full Prep.
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
