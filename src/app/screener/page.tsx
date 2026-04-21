'use client'

import { useState } from 'react'
import {
  ScreenerFlow,
  clearScreenerSession,
} from '@/app/_components/screener/ScreenerFlow'
import { ResultsDossier } from '@/app/_components/screener/ResultsDossier'
import { TrustFootnote } from '@/app/_components/ui'
import type { ScreenerAnswers, ScreenerResult } from '@contexts/screener'

/**
 * /screener — focused single-column transactional flow per PRD 01 +
 * docs/DESIGN-LANGUAGE.md.
 *
 * On completion: ResultsDossier renders the full editorial result
 * (the same dossier surfaced at /screener/results?token= for the
 * magic-link resume); client also POSTs to /api/screener/complete
 * which persists the session, writes a lead row, and queues the
 * magic-link email — best-effort, since the inline dossier is
 * already rendered.
 */

export default function ScreenerPage() {
  const [result, setResult] = useState<ScreenerResult | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pt-24 sm:pt-32">
          {!result && (
            <ScreenerFlow
              onComplete={(r, answers) => {
                setResult(r)
                clearScreenerSession()
                void postCompletion(answers).then(() => setEmailSent(true))
              }}
            />
          )}

          {result && <ResultsDossier result={result} emailSent={emailSent} />}
        </div>
      </main>

      <TrustFootnote asFooter />
    </div>
  )
}

async function postCompletion(answers: ScreenerAnswers): Promise<void> {
  try {
    await fetch('/api/screener/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
  } catch {
    // Best-effort. The server route logs delivery via the
    // observability adapters; a missing email is recoverable by
    // re-running the screener.
  }
}
