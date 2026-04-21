import {
  Button,
  Card,
  Eyebrow,
  Footnote,
  FootnoteContent,
  Hairline,
  KbdShortcut,
  StatusBanner,
} from '@/app/_components/ui'

/**
 * UI kit — the "Storybook alternative" called out in task #12 acceptance.
 * Every design-system primitive renders here. Reviewers visit /ui-kit to
 * eyeball the design language; visual diff baseline is captured via the
 * Playwright anonymous project (added below the fold).
 *
 * Excluded from production sitemap (noindex meta on the marketing layout
 * for /ui-kit specifically lands once the marketing layout exists in
 * task #14; for now this page is reachable but unannounced).
 */

export const metadata = {
  title: 'UI kit',
  robots: { index: false, follow: false },
}

export default function UiKitPage() {
  return (
    <main className="min-h-[100dvh] bg-paper text-ink">
      <header className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <Eyebrow>Design system</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display">
          UI primitives
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink/80">
          Every component in this kit honors the contract in{' '}
          <code className="font-mono text-sm">docs/DESIGN-LANGUAGE.md</code>:
          ink-on-paper, single customs-orange accent, hairline rules, no
          shadows, restrained motion. Magazine-underline CTA pattern is
          reserved for editorial actions; the solid CTA is the
          earn-the-emphasis variant used once per screen.
        </p>
      </header>

      <Hairline />

      <section className="mx-auto max-w-5xl space-y-12 px-6 py-16 sm:px-10">
        {/* Buttons */}
        <Card title="Buttons">
          <div className="flex flex-wrap items-center gap-6">
            <Button>Continue</Button>
            <Button size="lg">Continue (lg)</Button>
            <Button as="a" href="/screener" variant="underline">
              Check eligibility
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>

        {/* StatusBanner */}
        <Card title="Status banner">
          <p className="mb-6 text-sm text-ink/70">
            Anchored to the top of every authenticated page. Case ID in
            mono, status in accent or status color, next action as a
            magazine-underlined link.
          </p>
          <div className="-mx-6 border-y border-rule sm:-mx-8">
            <StatusBanner
              caseId="2026-04-1138"
              status="ENTRY LIST READY"
              nextAction={{
                label: 'Review your entry list',
                href: '/app/case/2026-04-1138',
              }}
            />
          </div>
          <div className="mt-6 -mx-6 border-y border-rule sm:-mx-8">
            <StatusBanner
              caseId="2026-04-0042"
              status="DEFICIENT — CBP REQUEST"
              severity="blocking"
              nextAction={{
                label: 'See CBP response',
                href: '/app/case/2026-04-0042',
              }}
            />
          </div>
        </Card>

        {/* Eyebrow + Hairline */}
        <Card title="Eyebrow + Hairline">
          <Eyebrow>Section II</Eyebrow>
          <p className="mt-4">
            The eyebrow sits above section headings as a small mono label;
            the hairline ends each section.
          </p>
          <div className="my-8">
            <Hairline label="II · Recovery" />
          </div>
          <Hairline />
        </Card>

        {/* Footnote */}
        <Card title="Footnote">
          <p>
            Refund timing depends on CBP review cycles
            <Footnote id="fn-cbp">
              Typical processing: 6–12 months from filing. We do not control
              this timeline.
            </Footnote>
            and may extend further during peak periods.
          </p>
          <Hairline className="my-6" />
          <ol className="space-y-2">
            <FootnoteContent id="fn-cbp">
              Typical processing: 6–12 months from filing. We do not
              control this timeline.
            </FootnoteContent>
          </ol>
        </Card>

        {/* KbdShortcut */}
        <Card title="Keyboard shortcuts">
          <p className="mb-4 text-sm text-ink/70">
            Used in the ops console (per PRD 04 — keyboard-first
            workflow).
          </p>
          <ul className="space-y-3 font-sans text-sm">
            <li className="flex items-center justify-between">
              <span>Open shortcut overlay</span>
              <KbdShortcut keys={['?']} />
            </li>
            <li className="flex items-center justify-between">
              <span>Claim case</span>
              <KbdShortcut keys={['c']} />
            </li>
            <li className="flex items-center justify-between">
              <span>Mark entry verified</span>
              <KbdShortcut keys={['Shift', 'V']} />
            </li>
          </ul>
        </Card>
      </section>
    </main>
  )
}
