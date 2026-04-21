import { SiteFooter } from './_components/SiteFooter'
import { SiteHeader } from './_components/SiteHeader'

/**
 * Marketing route-group layout. Every marketing page gets the
 * SiteHeader masthead + shared SiteFooter. The footer hosts the
 * real-text disclosures per
 * .claude/rules/disclosure-language-required.md.
 */

export default function MarketingLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  )
}
