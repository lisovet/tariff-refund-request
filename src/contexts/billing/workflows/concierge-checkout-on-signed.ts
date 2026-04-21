import { inngest } from '@shared/infra/inngest/client'
import { conciergeSigned } from '@shared/infra/inngest/events'
import type { CheckoutClient } from '../checkout'
import { createCheckoutForSku } from '../checkout'
import type { PricingTier, Sku } from '../pricing'

/**
 * Opens the Stripe Checkout session only AFTER the Concierge
 * engagement letter has been e-signed (task #73). This is the
 * single code path that may open Concierge checkout — any other
 * attempt must fail the `ConciergeCheckoutGate` read in
 * `e-sign/checkout-gate.ts`.
 *
 * Payload carried on the event:
 *   caseId, sku, agreementId, agreementVersion, envelopeId,
 *   signedAtIso, signerEmail, signerName
 *
 * The handler is pure + dependency-injected so unit tests inject
 * a fake CheckoutClient; the Inngest wrapper resolves the real
 * Stripe-backed client at invocation time.
 */

export interface ConciergeCheckoutOnSignedInput {
  readonly event: {
    readonly id?: string
    readonly data: {
      readonly caseId: string
      readonly sku: string
      readonly agreementId: string
      readonly agreementVersion: number
      readonly envelopeId: string
      readonly signedAtIso: string
      readonly signerEmail: string
      readonly signerName: string
    }
  }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
  }
}

export interface ConciergeCheckoutOnSignedDeps {
  readonly checkoutClient: CheckoutClient
  /** Deep link used by Stripe Checkout for success / cancel URLs.
   *  e.g. `https://app.example.com`. */
  readonly appOrigin: string
  /** Pricing tier to charge — inherited from the case. Defaults to
   *  `smb` if the caller doesn't know; production wiring resolves
   *  tier from the case. */
  readonly tier: PricingTier
}

export type ConciergeCheckoutOnSignedResult =
  | {
      readonly ok: true
      readonly checkoutSessionId: string
      readonly checkoutUrl: string | null
    }
  | {
      readonly ok: false
      readonly reason: 'sku_not_concierge'
    }

export async function conciergeCheckoutOnSignedHandler(
  input: ConciergeCheckoutOnSignedInput,
  deps: ConciergeCheckoutOnSignedDeps,
): Promise<ConciergeCheckoutOnSignedResult> {
  const { event, step } = input

  // Defense in depth — the event should only ever fire for the
  // Concierge SKU, but the event schema types `sku: string`.
  if (event.data.sku !== 'concierge') {
    return { ok: false, reason: 'sku_not_concierge' }
  }

  const session = await step.run('open-checkout-after-signature', async () =>
    createCheckoutForSku(
      {
        sku: event.data.sku as Sku,
        tier: deps.tier,
        screenerSessionId: event.data.envelopeId, // envelope id is stable + unique
        origin: deps.appOrigin,
        customerEmail: event.data.signerEmail,
      },
      deps.checkoutClient,
    ),
  )

  return {
    ok: true,
    checkoutSessionId: session.sessionId,
    checkoutUrl: session.url,
  }
}

export const conciergeCheckoutOnSignedWorkflow = inngest.createFunction(
  { id: 'concierge-checkout-on-signed', triggers: [conciergeSigned] },
  async (input) => {
    const { getStripeCheckoutClient, getAppOrigin } = await import('../server')
    const adapted = input as unknown as ConciergeCheckoutOnSignedInput
    return conciergeCheckoutOnSignedHandler(adapted, {
      checkoutClient: getStripeCheckoutClient(),
      appOrigin: getAppOrigin(),
      tier: 'smb',
    })
  },
)
