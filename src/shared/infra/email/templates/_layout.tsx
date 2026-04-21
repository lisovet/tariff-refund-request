import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { NOT_LEGAL_ADVICE_DISCLOSURE } from '@/app/_components/ui/Disclosure'

/**
 * Shared editorial-email shell. Every template wraps its body in this
 * layout so the canonical "Not legal advice" disclosure appears on
 * every send (per .claude/rules/disclosure-language-required.md).
 *
 * Email rendering can't use Tailwind tokens directly — inline styles
 * carry the design language: ink-on-paper canvas, Berkeley Mono /
 * serif fallback chain, restraint over spectacle.
 */

const COLORS = {
  ink: '#0E0E0C',
  paper: '#F4F1EA',
  paper2: '#ECE7DC',
  rule: '#1F1F1B',
  accent: '#B8431B',
  ink60: 'rgba(14,14,12,0.6)',
} as const

const FONTS = {
  body: '"Söhne","Neue Haas Grotesk","Inter Tight",system-ui,sans-serif',
  display:
    '"GT Sectra","Tiempos Headline","Newsreader","Source Serif Pro",Georgia,serif',
  mono: '"Berkeley Mono","JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
} as const

interface Props {
  readonly preview: string
  readonly children: React.ReactNode
}

export function EmailLayout({ preview, children }: Props) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: '32px 0',
          backgroundColor: COLORS.paper,
          fontFamily: FONTS.body,
          color: COLORS.ink,
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '32px',
            backgroundColor: COLORS.paper,
          }}
        >
          {children}

          <Hr
            style={{
              border: 'none',
              borderTop: `1px solid ${COLORS.rule}`,
              opacity: 0.18,
              margin: '40px 0 24px',
            }}
          />
          <Section>
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.6,
                color: COLORS.ink60,
              }}
            >
              {NOT_LEGAL_ADVICE_DISCLOSURE}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const EMAIL_COLORS = COLORS
export const EMAIL_FONTS = FONTS
