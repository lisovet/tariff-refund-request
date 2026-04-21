import { SiteFooter } from './_components/SiteFooter'

/**
 * Marketing route-group layout. Wraps every marketing page with the
 * shared site footer (real-text disclosures live there per
 * .claude/rules/disclosure-language-required.md).
 *
 * Header / nav lands in a follow-up — for v1, the homepage is
 * intentionally header-less so the editorial hero owns the fold.
 */

export default function MarketingLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
