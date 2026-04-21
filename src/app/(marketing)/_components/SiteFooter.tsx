import { Hairline, TrustFootnote } from '@/app/_components/ui'

/**
 * Marketing-site footer. Per .claude/rules/disclosure-language-required.md:
 * "Not legal advice" is real text on every page (not an image, not a
 * collapsed accordion). The trust + status + contact links sit above
 * the disclosure block.
 */

/**
 * Only working routes appear here. /recovery, /cape-prep, /concierge,
 * /for-agencies, and /trust/legal-requests are real pages in PRD
 * scope but haven't shipped — linking to 404s would erode trust on
 * the very footer where the trust posture lives. They return when
 * the pages exist.
 */
const SECTIONS: ReadonlyArray<{
  readonly heading: string
  readonly links: ReadonlyArray<{ readonly label: string; readonly href: string }>
}> = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Check eligibility', href: '/screener' },
    ],
  },
  {
    heading: 'Trust',
    links: [
      { label: 'How we handle your data', href: '/trust' },
      { label: 'Sub-processors', href: '/trust/sub-processors' },
      { label: 'Security', href: '/trust/security' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign in', href: '/sign-in' },
      { label: 'Sign up', href: '/sign-up' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-paper-2">
      <Hairline />
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-3">
          {SECTIONS.map((section) => (
            <nav
              key={section.heading}
              aria-label={section.heading}
              className="flex flex-col"
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                {section.heading}
              </p>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-ink underline underline-offset-[6px] decoration-ink/20 hover:decoration-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 border-t border-rule pt-8">
          <TrustFootnote />
        </div>
      </div>
    </footer>
  )
}
