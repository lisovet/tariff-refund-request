/**
 * E-sign flow — public surface for the billing context.
 *
 * Per PRD 10: the Concierge engagement letter must be e-signed
 * before Stripe Checkout opens. Layering:
 *
 *   requestConciergeSignature → ESignProvider requests an envelope
 *   → (customer signs) → provider webhook → handleSignatureCompleted
 *   → platform/concierge.signed event → Inngest workflow opens
 *   Checkout.
 *
 * ConciergeCheckoutGate is the read-side: anywhere checkout is
 * about to be created for a Concierge SKU, consult the gate first.
 */

export type {
  ESignProvider,
  ProviderRequestInput,
  ProviderRequestResult,
  SignatureCompletedEvent,
  SignedAgreementRecord,
  SignedAgreementRepo,
  SignedAgreementStatus,
  RecordPendingInput,
  MarkSignedInput,
} from './types'
export { SIGNED_AGREEMENT_STATUSES } from './types'

export { createInMemorySignedAgreementRepo } from './in-memory-repo'
export { createInMemoryESignProvider } from './in-memory-provider'

export {
  requestConciergeSignature,
  type RequestSignatureInput,
  type RequestSignatureResult,
  type RequestSignatureDeps,
} from './request-signature'

export {
  handleSignatureCompleted,
  type HandleSignatureInput,
  type HandleSignatureResult,
  type HandleSignatureDeps,
  type ConciergeSignedEventData,
} from './handle-signature'

export type { ConciergeCheckoutGate } from './checkout-gate'
export { conciergeCheckoutGate } from './checkout-gate'
