import Link from 'next/link'
import { Button, Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * `/checkout/success` — where Stripe redirects after the customer
 * completes payment. This page does NOT verify payment with Stripe
 * itself; the webhook is authoritative. The experience here is
 * purely the confirmation landing:
 *
 *   1. "Your purchase is confirmed" copy.
 *   2. Tells the customer to expect an email (the post-payment
 *      workflow at `src/contexts/ops/workflows/payment-completed.ts`
 *      sends `RecoveryPurchasedEmail` with a workspace link).
 *   3. CTA to `/app` for users who want to jump straight to the
 *      workspace now.
 *
 * Stripe passes `?session={CHECKOUT_SESSION_ID}&screener=...`. We
 * don't render the session id; it's kept in the URL for support
 * handoffs only.
 */

export const metadata = {
  title: 'Purchase confirmed',
  description:
    'Your purchase is confirmed. Your recovery workspace is being set up.',
}

export default function CheckoutSuccessPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-3xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Confirmation</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          Purchase confirmed.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          Your recovery workspace is being set up. Within a minute
          you&rsquo;ll get an email with a direct link to it. You can
          also open it now from the dashboard.
        </p>
        <div className="mt-10 flex items-center gap-6">
          <Button as="a" href="/app" variant="solid" size="lg">
            Open my workspace
          </Button>
          <Link
            href="/how-it-works"
            className="font-mono text-sm text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent"
          >
            Read how the service works
          </Link>
        </div>
      </header>

      <Hairline />

      <section className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
        <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
          What happens next.
        </h2>
        <ol className="mt-10 space-y-6 text-base text-ink/85">
          <li>
            <strong className="text-ink">1. Upload what you have.</strong>{' '}
            7501s, broker spreadsheets, carrier invoices, ACE CSVs —
            whatever ties your entries to the IEEPA window.
          </li>
          <li>
            <strong className="text-ink">2. We reconcile.</strong> An
            analyst cross-checks your sources and rebuilds the entry
            list. Every entry carries its source document.
          </li>
          <li>
            <strong className="text-ink">3. You review the list.</strong>{' '}
            When it&rsquo;s ready, you get the entry list back with
            the gap analysis that determines the next step.
          </li>
        </ol>
      </section>
    </main>
  )
}
