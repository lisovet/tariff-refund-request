'use client'

import { useState } from 'react'
import { ScreenerFlow, clearScreenerSession } from '@/app/_components/screener/ScreenerFlow'
import { TrustFootnote, Eyebrow, Hairline, Button } from '@/app/_components/ui'
import type { ScreenerResult } from '@contexts/screener'

/**
 * /screener — focused single-column transactional flow per PRD 01 +
 * docs/DESIGN-LANGUAGE.md ("Single-column for transactional flows ...
 * no sidebar distractions"). Lives outside the marketing route group
 * so it doesn't inherit the full SiteFooter.
 *
 * Persistence:
 *   - In-session: ScreenerFlow auto-persists answers to sessionStorage.
 *   - Magic-link resume across days: lands in task #23.
 *   - DB persistence on completion: lands in task #25.
 *
 * The results dossier currently renders inline as the post-completion
 * state. Task #24 builds the dedicated photographable Results page.
 */

export default function ScreenerPage() {
  const [result, setResult] = useState<ScreenerResult | null>(null)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pt-24 sm:pt-32">
          {!result && (
            <ScreenerFlow
              onComplete={(r) => {
                setResult(r)
                clearScreenerSession()
              }}
            />
          )}

          {result && <ScreenerResultCard result={result} />}
        </div>
      </main>

      <TrustFootnote asFooter />
    </div>
  )
}

function ScreenerResultCard({ result }: { readonly result: ScreenerResult }) {
  if (result.qualification === 'disqualified') {
    return (
      <article>
        <Eyebrow>Result</Eyebrow>
        <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
          Probably not a fit right now.
        </h1>
        <p className="mt-8 text-lg text-ink/85">
          Based on your answers we don&apos;t see an obvious IEEPA refund
          here. If your situation changes — say, you become the
          Importer of Record on a new lane, or your records turn up
          old IEEPA-window entries — we&apos;d like to hear from you.
        </p>
        <p className="mt-4 text-sm text-ink/60">
          Reason:{' '}
          <span className="font-mono">{result.disqualificationReason}</span>
        </p>
        <Hairline className="my-12" />
        <p className="text-sm text-ink/70">
          You can{' '}
          <a
            href="/how-it-works"
            className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
          >
            read how the service works
          </a>{' '}
          if you&apos;re evaluating it for someone else.
        </p>
      </article>
    )
  }

  return (
    <article>
      <Eyebrow>Result</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
        Likely a fit.
      </h1>
      {result.refundEstimate && (
        <p className="mt-12">
          <span className="block font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
            Estimated refund range
          </span>
          <span className="mt-3 block font-mono text-4xl text-ink sm:text-6xl">
            ${result.refundEstimate.low.toLocaleString()} —{' '}
            ${result.refundEstimate.high.toLocaleString()}
          </span>
          <span className="mt-3 block font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Confidence: {result.refundEstimate.confidence}
          </span>
        </p>
      )}
      <Hairline className="my-12" />
      <p className="text-base text-ink/85">
        Recommended next step:{' '}
        <span className="font-mono text-accent">
          {result.recommendedNextStep}
        </span>
      </p>
      <div className="mt-10">
        <Button as="a" href="/how-it-works" variant="underline" size="lg">
          See how each stage works
        </Button>
      </div>
    </article>
  )
}
