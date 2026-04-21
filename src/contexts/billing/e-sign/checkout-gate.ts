import type { SignedAgreementRepo } from './types'

/**
 * Read-side gate: before opening a Stripe Checkout session for the
 * Concierge SKU, confirm a signed agreement exists for the case.
 *
 * The existence of a signed record is the ENTIRE permission — the
 * checkout-session creator calls this; the gate does not create
 * sessions itself (separation of concerns with `checkout.ts`).
 */

export interface ConciergeCheckoutGate {
  readonly repo: SignedAgreementRepo
}

export function conciergeCheckoutGate(repo: SignedAgreementRepo): {
  canOpenCheckout(caseId: string): Promise<{
    canProceed: boolean
    reason: 'no_signed_agreement' | undefined
  }>
} {
  return {
    async canOpenCheckout(caseId: string) {
      const records = await repo.findSignedByCase(caseId)
      if (records.length === 0) {
        return { canProceed: false, reason: 'no_signed_agreement' }
      }
      return { canProceed: true, reason: undefined }
    },
  }
}
