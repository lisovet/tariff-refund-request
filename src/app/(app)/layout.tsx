import { ClerkProvider } from '@clerk/nextjs'
import { TrustFootnote } from '@/app/_components/ui'
import { EnsureActiveOrg } from '@/app/_components/auth/EnsureActiveOrg'

/**
 * Customer-app route-group layout. ClerkProvider mounts here (not at
 * the root) so marketing + screener pages don't pay the Clerk
 * bootstrap cost or risk hydration failures on hosts outside the
 * Clerk-configured frontend domain.
 *
 * The status banner from PRD 04 anchors the top of every
 * authenticated page (lands in task #51). The compact trust
 * footnote anchors the bottom on every page so the canonical
 * disclosure stays present per
 * .claude/rules/disclosure-language-required.md.
 */

export default function AppLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <EnsureActiveOrg />
      <div className="flex min-h-[100dvh] flex-col bg-paper">
        <div className="flex-1">{children}</div>
        <TrustFootnote asFooter />
      </div>
    </ClerkProvider>
  )
}
