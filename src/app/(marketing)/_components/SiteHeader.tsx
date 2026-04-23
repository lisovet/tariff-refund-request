import Link from 'next/link'
import { Button } from '@/app/_components/ui'

/**
 * Marketing masthead — editorial magazine style per
 * docs/DESIGN-LANGUAGE.md. Three columns on desktop:
 *
 *   [ TARIFF · REFUND ]        [ nav ]        [ CTA ]
 *
 * - Wordmark in mono, small caps with a middle-dot separator so
 *   it reads like a publication masthead, not a product logo.
 *   Clicks home from any marketing page.
 * - Primary nav is three links (How it works / Pricing / Trust) —
 *   the minimum set per PRD 05. Everything else lives in the footer.
 * - Right side is the single accent CTA ("Check eligibility"). Per
 *   the design-language rule: exactly one accent CTA above the fold.
 *   Sign-in is intentionally omitted at launch — every customer is
 *   onboarded by an account manager, and there is no self-serve
 *   portal to sign into yet. Re-introduce when the customer app ships.
 * - Hairline bottom border. No shadow. No backdrop-blur. No sticky
 *   positioning — these pages scroll like print.
 */

const NAV: ReadonlyArray<{ readonly label: string; readonly href: string }> = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Trust', href: '/trust' },
]

export function SiteHeader() {
  return (
    <header
      role="banner"
      className="border-b border-rule bg-paper"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5 sm:px-10">
        <Link
          href="/"
          aria-label="Tariff Refund Request — home"
          className="font-mono text-sm uppercase tracking-[0.24em] text-ink hover:text-accent"
        >
          Tariff <span aria-hidden="true" className="text-ink/40">·</span> Refund <span aria-hidden="true" className="text-ink/40">·</span> Request
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-sans text-sm text-ink/80 underline underline-offset-[6px] decoration-transparent hover:decoration-ink/40 hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <Button as="a" href="/screener" variant="solid">
            Check eligibility
          </Button>
        </div>
      </div>
    </header>
  )
}
