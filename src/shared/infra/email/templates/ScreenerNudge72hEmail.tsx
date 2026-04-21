import { Button, Heading, Section, Text } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_FONTS, EmailLayout } from './_layout'

/**
 * 72h post-screener nudge per PRD 05.
 *
 * Founder-style framing: "what's actually hard". Honest about the
 * operational gap most importers hit. Single CTA back to the dossier.
 */

interface Props {
  readonly firstName?: string
  readonly resultsUrl: string
}

export function ScreenerNudge72hEmail({ firstName, resultsUrl }: Props) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
  return (
    <EmailLayout preview="The hard part is finding the entries — not the math.">
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
          The hard part isn&apos;t the math. It&apos;s the records.
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
          The biggest reason qualified importers don&apos;t file is the
          time it takes to assemble entry summaries from brokers,
          carriers, and ACE exports they&apos;ve never opened. We
          built the Recovery step specifically for that. Once you
          have a clean entry list, the rest is mechanical.
        </Text>

        <Text
          style={{
            margin: '0 0 16px',
            fontSize: '16px',
            lineHeight: 1.6,
            color: EMAIL_COLORS.ink,
          }}
        >
          If you&apos;d rather hand it off entirely, the Concierge
          tier handles filing coordination + CBP follow-up.
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
            Open my results →
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  )
}
