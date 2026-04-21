import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import './globals.css'

/*
 * Root layout. Marketing, app, and ops route groups all inherit from this.
 * ClerkProvider must wrap everything so useUser/auth() helpers work in
 * RSC + client components alike. Per ADR 004.
 *
 * Font strategy per DESIGN-LANGUAGE.md:
 *   - Display (headlines) → Newsreader (license-friendly proxy for
 *     GT Sectra; free; real serif so the editorial hierarchy lands).
 *   - Body / UI            → Geist Sans (proxy for Söhne; free).
 *   - Mono / IDs / numerics → Geist Mono (proxy for Berkeley Mono;
 *     tabular-numbers-friendly; free).
 * TODO(human-action): swap to licensed GT Sectra + Söhne + Berkeley
 * Mono when the fonts are purchased (drop the TTFs in public/fonts/
 * and replace these loaders with next/font/local).
 */

const display = Newsreader({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const sans = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'IEEPA Refund Audit & CAPE Filing Prep',
    template: '%s · Tariff Refund',
  },
  description:
    'The fastest, most trustworthy way for U.S. importers to go from "I think I paid these tariffs" to "I have a validated, submission-ready refund package."',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${display.variable} ${sans.variable} ${mono.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
