import { Button, Heading, Section, Text } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_FONTS, EmailLayout } from './_layout'

/**
 * Screener results email — sent after q10 captures the customer's
 * email. Carries a magic-link back to the results dossier (PRD 01).
 *
 * Editorial register: greeting + one paragraph of context + a single
 * accent CTA. No "Welcome to our community", no marketing fluff.
 */

interface Props {
  readonly firstName?: string
  readonly resultsUrl: string
}

export function ScreenerResultsEmail({ firstName, resultsUrl }: Props) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'

  return (
    <EmailLayout preview="Your screener results are ready.">
      <Section>
        <Heading
          as="h1"
          style={{
            margin: '0 0 24px',
            fontFamily: EMAIL_FONTS.display,
            fontSize: '32px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: EMAIL_COLORS.ink,
          }}
        >
          Your screener results.
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
            margin: '0 0 24px',
            fontSize: '16px',
            lineHeight: 1.6,
            color: EMAIL_COLORS.ink,
          }}
        >
          We saved your screener answers and produced a refund estimate
          plus a recovery-path recommendation. Open the link below to
          see the full result. The link will keep working for 7 days
          even if you change devices.
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
            fontFamily: EMAIL_FONTS.mono,
            fontSize: '12px',
            color: EMAIL_COLORS.ink60,
            wordBreak: 'break-all',
          }}
        >
          {resultsUrl}
        </Text>
      </Section>
    </EmailLayout>
  )
}
