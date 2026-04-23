import { Suspense } from 'react'
import { ConfirmationView } from '@/app/_components/screener/ConfirmationView'

export const metadata = {
  title: 'Thanks — a specialist will be in touch',
  description:
    "You've started your refund audit. Your account manager will reach out within 24 hours with the exact documents we need.",
}

/**
 * Post-payment confirmation route. Stripe is wired up later; today
 * /screener reaches this page via a client-side push from the Pay
 * buttons on the qualified results page. The view reads `?tier=` and
 * renders the right flavor of next-steps copy.
 */
export default function ConfirmationPage() {
  return (
    <main className="bg-paper">
      <Suspense fallback={null}>
        <ConfirmationView />
      </Suspense>
    </main>
  )
}
