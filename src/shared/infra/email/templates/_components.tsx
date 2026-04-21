import { Button, Heading, Section, Text } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_FONTS } from './_layout'

/**
 * Shared editorial primitives for lifecycle email templates. Email
 * rendering can't use Tailwind tokens directly — these components
 * carry the design language as inline styles.
 */

export function H1({ children }: { readonly children: React.ReactNode }) {
  return (
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
      {children}
    </Heading>
  )
}

export function P({
  children,
  size = 'md',
  muted = false,
}: {
  readonly children: React.ReactNode
  readonly size?: 'sm' | 'md'
  readonly muted?: boolean
}) {
  return (
    <Text
      style={{
        margin: '0 0 16px',
        fontSize: size === 'sm' ? '14px' : '16px',
        lineHeight: 1.6,
        color: muted ? EMAIL_COLORS.ink60 : EMAIL_COLORS.ink,
      }}
    >
      {children}
    </Text>
  )
}

export function PrimaryCta({
  href,
  label,
}: {
  readonly href: string
  readonly label: string
}) {
  return (
    <Section style={{ margin: '32px 0' }}>
      <Button
        href={href}
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
        {label}
      </Button>
    </Section>
  )
}

export function SecondaryLink({
  href,
  label,
}: {
  readonly href: string
  readonly label: string
}) {
  return (
    <a
      href={href}
      style={{
        color: EMAIL_COLORS.accent,
        textDecoration: 'underline',
      }}
    >
      {label}
    </a>
  )
}

export function greetingFor(firstName?: string): string {
  return firstName ? `Hi ${firstName},` : 'Hi,'
}
