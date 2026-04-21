import { TrustFootnote } from '@/app/_components/ui'
import { ShortcutOverlay } from './_components/ShortcutOverlay'

/**
 * Ops-console route-group layout. Same compact trust footnote as the
 * customer app — staff also see the canonical disclosure (the `/ops`
 * surface routinely produces customer-facing artifacts so the
 * disclosure context matters).
 *
 * The `ShortcutOverlay` mounts globally for the ops group so the
 * `?`-triggered reference is available on every page, not just the
 * queue or the case workspace.
 */

export default function OpsLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <div className="flex-1">{children}</div>
      <TrustFootnote asFooter />
      <ShortcutOverlay />
    </div>
  )
}
