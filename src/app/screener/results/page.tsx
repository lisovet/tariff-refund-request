import { notFound } from 'next/navigation'
import { getScreenerRepo, verifyToken } from '@contexts/screener/server'
import { Button, Eyebrow, TrustFootnote } from '@/app/_components/ui'
import { ResultsDossier } from '@/app/_components/screener/ResultsDossier'

/**
 * /screener/results?token=…
 *
 * Resume page for the magic-link in the screener-results email. The
 * server verifies the token, loads the session, and renders the
 * ResultsDossier — the same canonical surface the user saw inline at
 * the end of the screener flow.
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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pt-24 sm:pt-32">
          <ResultsDossier result={session.result} sessionId={session.id} />
        </div>
      </main>
      <TrustFootnote asFooter />
    </div>
  )
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
