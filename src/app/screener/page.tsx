'use client'

import { useEffect, useState } from 'react'
import { ScreenerFlow } from '@/app/_components/screener/ScreenerFlow'
import { ResultsDossier } from '@/app/_components/screener/ResultsDossier'
import { TrustFootnote } from '@/app/_components/ui'
import type { ScreenerAnswers, ScreenerResult } from '@contexts/screener'

/**
 * /screener — focused single-column transactional flow per PRD 01.
 *
 * Persistence: the completed ScreenerResult is saved to
 * sessionStorage so a page refresh rehydrates the dossier instead
 * of sending the customer back to question 1. Answers persist
 * during the flow via ScreenerFlow's own storage.
 *
 * On completion the client fires a best-effort POST to
 * /api/screener/complete which writes the lead row and queues the
 * magic-link email; the inline dossier is already authoritative,
 * so a transient network failure costs the customer nothing
 * visible.
 */

const RESULT_STORAGE_KEY = 'tariff-refund:screener-result:v1'

function loadSavedResult(): ScreenerResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as ScreenerResult) : null
  } catch {
    return null
  }
}

function saveResult(result: ScreenerResult): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result))
  } catch {
    // Ignored — the in-memory result keeps the dossier on screen.
  }
}

export default function ScreenerPage() {
  // Start as null on both server + client first render so hydration
  // matches; rehydrate from sessionStorage in an effect afterwards.
  const [result, setResult] = useState<ScreenerResult | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const saved = loadSavedResult()
    if (saved) setResult(saved)
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pt-24 sm:pt-32">
          {!result && (
            <ScreenerFlow
              onComplete={(r, answers) => {
                setResult(r)
                saveResult(r)
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
