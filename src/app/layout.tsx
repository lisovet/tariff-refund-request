import type { Metadata } from 'next'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import './globals.css'

/*
 * Root layout. Marketing, app, and ops route groups all inherit from this.
 *
 * ClerkProvider is NOT mounted here — it's mounted inside the (app)
 * and (ops) route-group layouts so marketing + screener pages don't
 * depend on Clerk JS bootstrapping. This avoids a whole class of
 * hydration failures on hosts that aren't the Clerk-configured
 * frontend domain (e.g., Railway's *.up.railway.app preview URLs),
 * and keeps marketing bundles ~150 KB lighter.
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
    default: 'Tariff Refund Request',
    template: '%s · Tariff Refund Request',
  },
  description:
    'We help U.S. importers reconstruct their IEEPA entry list, validate every line, and prepare a submission-ready refund package.',
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
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
