import { Button, Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * `/checkout/cancel` — where Stripe redirects when the customer
 * closes or aborts the Checkout. No charge has been made; the
 * screener session is preserved in the query string so the customer
 * can pick up where they were.
 */

export const metadata = {
  title: 'Checkout cancelled',
  description:
    'No charge was made. Go back to pricing or the eligibility screener.',
}

export default function CheckoutCancelPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-3xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          No charge made.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          You closed the Stripe checkout before completing payment,
          so nothing was billed. Your screener results are still
          saved.
        </p>
        <div className="mt-10 flex items-center gap-6">
          <Button as="a" href="/pricing" variant="solid" size="lg">
            Back to pricing
          </Button>
          <Button as="a" href="/screener" variant="underline" size="lg">
            Re-run the screener
          </Button>
        </div>
      </header>

      <Hairline />
    </main>
  )
}
