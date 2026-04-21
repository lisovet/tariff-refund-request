import { notFound } from 'next/navigation'
import { getScreenerRepo, verifyToken } from '@contexts/screener/server'
import {
  Button,
  Eyebrow,
  Hairline,
  TrustFootnote,
} from '@/app/_components/ui'
import type { ScreenerResult } from '@contexts/screener'

/**
 * /screener/results?token=…
 *
 * Resume page for the magic-link in the screener-results email. The
 * server verifies the token, loads the session, and renders the same
 * result the user saw inline at the end of the screener flow.
 *
 * Tokens are valid for 7 days (per PRD 01). Expired or tampered
 * tokens land on a friendly explainer that points back to /screener.
 */

export const metadata = {
  title: 'Your screener results',
  robots: { index: false, follow: false },
}

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ScreenerResultsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : undefined

  if (!token) {
    return <ResumeError reason="missing" />
  }

  const secret = process.env.MAGIC_LINK_SECRET
  if (!secret || secret.length < 32) {
    // Server-side misconfiguration; render a friendly fallback so we
    // don't leak the reason to the customer.
    return <ResumeError reason="misconfigured" />
  }

  const verified = verifyToken(token, { secret })
  if (!verified.ok) {
    return <ResumeError reason={verified.reason} />
  }

  const session = await getScreenerRepo().findSessionById(verified.payload.sessionId)
  if (!session || !session.result) {
    return notFound()
  }

  return <ResumeResult result={session.result} />
}

function ResumeError({
  reason,
}: {
  readonly reason: 'missing' | 'malformed' | 'bad_signature' | 'expired' | 'misconfigured'
}) {
  const message =
    reason === 'expired'
      ? 'This results link has expired (links are valid for 7 days). You can re-run the screener — your answers take about three minutes.'
      : 'We could not verify this results link. It may have been edited or copied incompletely. Try opening the original email link in full, or re-run the screener.'

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pt-32 sm:pt-40">
          <Eyebrow>Resume</Eyebrow>
          <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
            We could not load your results.
          </h1>
          <p className="mt-8 text-lg text-ink/85">{message}</p>
          <div className="mt-10">
            <Button as="a" href="/screener" variant="underline" size="lg">
              Re-run the screener
            </Button>
          </div>
        </div>
      </main>
      <TrustFootnote asFooter />
    </div>
  )
}

function ResumeResult({ result }: { readonly result: ScreenerResult }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pt-32 sm:pt-40">
          <Eyebrow>Your screener results</Eyebrow>
          {result.qualification === 'disqualified' ? (
            <>
              <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
                Probably not a fit right now.
              </h1>
              <p className="mt-8 text-lg text-ink/85">
                Based on your answers we don&apos;t see an obvious IEEPA
                refund here. Reason:{' '}
                <span className="font-mono">{result.disqualificationReason}</span>
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </main>
      <TrustFootnote asFooter />
    </div>
  )
}
