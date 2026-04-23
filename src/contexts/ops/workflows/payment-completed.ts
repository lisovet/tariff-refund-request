import {
  RecoveryPurchasedEmail,
  renderEmail,
  type EmailTransport,
} from '@shared/infra/email'
import { inngest } from '@shared/infra/inngest/client'
import {
  caseStateTransitioned,
  paymentCompleted,
} from '@shared/infra/inngest/events'
import type { IdentityRepo } from '@contexts/identity'
import type { CaseRepo } from '../repo'
import { transition, type CaseTransitionedPayload } from '../transition'

/**
 * Post-payment case-creation workflow per PRD 04 + PRD 06.
 *
 * Triggered by `platform/payment.completed`. Resolves the buyer's
 * customer record (signup-first: the row exists because sign-up
 * happened before the Buy button), creates a `Case` row, transitions
 * it out of `new_lead` via `RECOVERY_PURCHASED`, and sends the
 * purchase-confirmation email that points at the new workspace.
 *
 * Per ADR 007: durable, replayable. Each step.run is idempotent.
 *
 * The tier and sku in `event.data` came from Stripe Checkout
 * metadata (set by `buildCheckoutSessionParams` in
 * `src/contexts/billing/checkout.ts`). If either is unknown the
 * workflow bails with a structured result; the webhook-level
 * handler logs the cause.
 */

export type CaseTier = 'smb' | 'mid_market'

const VALID_TIERS: readonly CaseTier[] = ['smb', 'mid_market']

export interface PaymentCompletedHandlerInput {
  readonly event: {
    id?: string
    data: {
      sessionId: string
      sku: string
      tier: string
      stripeChargeId: string
      amountUsdCents: number
      email: string
    }
  }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
  }
}

export interface PaymentCompletedHandlerDeps {
  readonly caseRepo: CaseRepo
  readonly identityRepo: IdentityRepo
  readonly email: EmailTransport
  readonly fromAddress: string
  readonly appOrigin: string
  readonly publishCaseTransitioned: (
    payload: CaseTransitionedPayload,
  ) => Promise<void>
  readonly clock?: () => Date
}

export type PaymentCompletedResult =
  | {
      readonly outcome: 'ok'
      readonly caseId: string
    }
  | {
      readonly outcome: 'skipped'
      readonly reason:
        | 'unknown_tier'
        | 'customer_not_found'
        | 'transition_failed'
      readonly detail?: string
    }

export async function paymentCompletedHandler(
  input: PaymentCompletedHandlerInput,
  deps: PaymentCompletedHandlerDeps,
): Promise<PaymentCompletedResult> {
  const { event, step } = input
  const { sessionId, tier, email } = event.data

  if (!VALID_TIERS.includes(tier as CaseTier)) {
    return { outcome: 'skipped', reason: 'unknown_tier', detail: tier }
  }
  const caseTier = tier as CaseTier

  const customer = await step.run('resolve-customer', () =>
    deps.identityRepo.findCustomerByEmail(email),
  )
  if (!customer) {
    return { outcome: 'skipped', reason: 'customer_not_found', detail: email }
  }

  const caseRecord = await step.run('create-case', () =>
    deps.caseRepo.createCase({
      tier: caseTier,
      customerId: customer.id,
      screenerSessionId: sessionId,
    }),
  )

  // Direct /pricing purchases short-circuit the screener + lifecycle
  // cadence, but the state machine models each of those transitions
  // explicitly (new_lead → qualified → awaiting_purchase → awaiting_docs).
  // We fire all three in sequence so the audit log reflects that the
  // customer effectively passed every gate before landing on the
  // upload workspace. Each transition is its own `step.run` so Inngest
  // retries land on the correct one after a partial failure.
  const transitionSequence: Array<{
    readonly name: string
    readonly event: { type: 'SCREENER_RESULT_QUALIFIED' | 'LIFECYCLE_DELIVERED' | 'RECOVERY_PURCHASED' }
  }> = [
    { name: 'transition-to-qualified', event: { type: 'SCREENER_RESULT_QUALIFIED' } },
    { name: 'transition-to-awaiting-purchase', event: { type: 'LIFECYCLE_DELIVERED' } },
    { name: 'transition-to-awaiting-docs', event: { type: 'RECOVERY_PURCHASED' } },
  ]

  for (const hop of transitionSequence) {
    const result = await step.run(hop.name, () =>
      transition(
        { caseId: caseRecord.id, event: hop.event },
        {
          repo: deps.caseRepo,
          publishCaseTransitioned: deps.publishCaseTransitioned,
          clock: deps.clock,
        },
      ),
    )
    if (!result.ok) {
      return {
        outcome: 'skipped',
        reason: 'transition_failed',
        detail: `${caseRecord.id}@${hop.name}: ${result.reason}`,
      }
    }
  }

  const caseUrl = `${deps.appOrigin}/app/case/${caseRecord.id}/recovery`
  const firstName = customer.fullName?.split(' ')[0]

  await step.run('send-purchase-email', async () => {
    const rendered = await renderEmail(
      RecoveryPurchasedEmail({
        firstName,
        caseUrl,
      }),
    )
    return deps.email.send({
      from: deps.fromAddress,
      to: email,
      subject: 'Your Recovery workspace is open.',
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `recovery-purchased:${caseRecord.id}`,
    })
  })

  return { outcome: 'ok', caseId: caseRecord.id }
}

/**
 * Inngest-wrapped function. Registered in `src/contexts/ops/server.ts`
 * and the registry at `src/shared/infra/inngest/workflows/index.ts`.
 */
export const paymentCompletedWorkflow = inngest.createFunction(
  { id: 'ops-case-on-payment', triggers: [paymentCompleted] },
  async (input) => {
    const [{ getCaseRepo }, { getIdentityRepo }, { getEmailTransport, getEmailFrom }] =
      await Promise.all([
        import('../server'),
        import('@contexts/identity'),
        import('@shared/infra/email'),
      ])

    // `NEXT_PUBLIC_APP_URL` is the canonical public origin; same env
    // var the Clerk middleware uses. A sibling `getAppOrigin` helper
    // may land with the Clerk PR — keep the read inline here so this
    // workflow stays independent of that branch's merge order.
    const appOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(
      /\/+$/,
      '',
    )
    if (!appOrigin) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL is not set; workspace URLs in the confirmation email would be broken.',
      )
    }

    const adapted = input as unknown as PaymentCompletedHandlerInput
    return paymentCompletedHandler(adapted, {
      caseRepo: getCaseRepo(),
      identityRepo: getIdentityRepo(),
      email: getEmailTransport(),
      fromAddress: getEmailFrom(),
      appOrigin,
      publishCaseTransitioned: async (payload) => {
        await inngest.send({
          name: 'platform/case.state.transitioned',
          data: payload,
        })
      },
    })
  },
)

// Re-export the event type so tests don't have to reach into
// @shared/infra/inngest.
export { caseStateTransitioned }
