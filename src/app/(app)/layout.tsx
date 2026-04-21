import { TrustFootnote } from '@/app/_components/ui'

/**
 * Customer-app route-group layout. The status banner from PRD 04 anchors
 * the top of every authenticated page (lands in task #51). The compact
 * trust footnote anchors the bottom on every page so the canonical
 * disclosure stays present per .claude/rules/disclosure-language-required.md.
 */

export default function AppLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <div className="flex-1">{children}</div>
      <TrustFootnote asFooter />
    </div>
  )
}
