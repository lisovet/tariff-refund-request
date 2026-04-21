import type { Metadata } from 'next'
import './globals.css'

/*
 * Root layout. Marketing, app, and ops route groups all inherit from this.
 * TODO(human-action): wire real font files for GT Sectra / Söhne / Berkeley
 * Mono once licensed; today the fallback chain in tailwind.config.ts handles it.
 */

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
