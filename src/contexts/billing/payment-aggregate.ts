import {
  PAYMENT_KINDS as SCHEMA_PAYMENT_KINDS,
  type PaymentKind,
  type PaymentStatus,
} from '@shared/infra/db/schema'
import {
  SUCCESS_FEE_HARD_CAP,
  computeSuccessFeeCents,
  type PricingTier,
} from './pricing'

/**
 * Payment aggregate per PRD 06.
 *
 * Two responsibilities:
 *   1. recordPayment — idempotent (on stripeEventId) write of a
 *      Stripe charge / refund / credit into the local ledger.
 *   2. generateSuccessFeeInvoice — creates a success_fee_invoice
 *      row whose amount is clamped against:
 *        - the per-case ladder hard cap ($50k)
 *        - amounts already success-fee-invoiced for this case
 *          (idempotent on retried `paid` events per PRD 06)
 *        - the remaining refund headroom after Stripe refunds we
 *          already issued back to the customer (PRD 06 edge case:
 *          "refund issued before success-fee invoice → invoice
 *          clamps to remaining amount")
 */

export const PAYMENT_KINDS = SCHEMA_PAYMENT_KINDS

export interface PaymentRecord {
  readonly id: string
  readonly caseId: string
  readonly kind: PaymentKind
  readonly stripeEventId: string | null
  readonly stripeChargeId: string | null
  readonly stripeInvoiceId: string | null
  readonly sku: string | null
  readonly amountUsdCents: number
  readonly currency: string
  readonly status: PaymentStatus
  readonly metadata: Record<string, unknown>
  readonly occurredAt: Date
}

export interface InsertPaymentInput {
  readonly id: string
  readonly caseId: string
  readonly kind: PaymentKind
  readonly stripeEventId: string | null
  readonly stripeChargeId: string | null
  readonly stripeInvoiceId: string | null
  readonly sku: string | null
  readonly amountUsdCents: number
  readonly currency: string
  readonly status: PaymentStatus
  readonly metadata: Record<string, unknown>
  readonly occurredAt: Date
}

export type InsertPaymentResult =
  | { readonly outcome: 'created'; readonly payment: PaymentRecord }
  | { readonly outcome: 'duplicate'; readonly payment: PaymentRecord }

export interface PaymentRepo {
  insertPayment(input: InsertPaymentInput): Promise<InsertPaymentResult>
  findPaymentByEventId(stripeEventId: string): Promise<PaymentRecord | undefined>
  listPaymentsForCase(caseId: string): Promise<readonly PaymentRecord[]>
}

// --- recordPayment --------------------------------------------------

export interface RecordPaymentInput {
  readonly caseId: string
  readonly kind: PaymentKind
  readonly stripeEventId: string
  readonly stripeChargeId?: string | null
  readonly stripeInvoiceId?: string | null
  readonly sku?: string | null
  readonly amountUsdCents: number
  readonly currency?: 'usd'
  readonly status: PaymentStatus
  readonly metadata?: Record<string, unknown>
  readonly occurredAt: Date
}

export interface RecordPaymentDeps {
  readonly repo: PaymentRepo
  readonly newPaymentId?: () => string
}

export type RecordPaymentResult = InsertPaymentResult

export async function recordPayment(
  input: RecordPaymentInput,
  deps: RecordPaymentDeps,
): Promise<RecordPaymentResult> {
  const existing = await deps.repo.findPaymentByEventId(input.stripeEventId)
  if (existing) return { outcome: 'duplicate', payment: existing }
  const id = (deps.newPaymentId ?? defaultPaymentId)()
  return deps.repo.insertPayment({
    id,
    caseId: input.caseId,
    kind: input.kind,
    stripeEventId: input.stripeEventId,
    stripeChargeId: input.stripeChargeId ?? null,
    stripeInvoiceId: input.stripeInvoiceId ?? null,
    sku: input.sku ?? null,
    amountUsdCents: input.amountUsdCents,
    currency: input.currency ?? 'usd',
    status: input.status,
    metadata: input.metadata ?? {},
    occurredAt: input.occurredAt,
  })
}

// --- computeSuccessFeeInvoiceCents ---------------------------------

export interface SuccessFeeInvoiceInput {
  readonly realizedRefundCents: number
  readonly tier: PricingTier
  readonly rate?: number
  /** Sum of prior success_fee_invoice amounts for this case. */
  readonly alreadyInvoicedSuccessFeeCents: number
  /**
   * Sum of Stripe refunds we've already issued back to the customer
   * (positive cents — pass the absolute value of the refund). Per PRD
   * 06 the new invoice must not push the customer's net cost beyond
   * the realized refund, so we clamp to the remaining headroom.
   */
  readonly alreadyRefundedToCustomerCents: number
}

export function computeSuccessFeeInvoiceCents(input: SuccessFeeInvoiceInput): number {
  if (input.realizedRefundCents <= 0) return 0

  const rawFee = computeSuccessFeeCents({
    refundAmountUsdCents: input.realizedRefundCents,
    tier: input.tier,
    rate: input.rate,
  })

  // Clamp #1: per-case ladder hard cap. computeSuccessFeeCents already
  // applies SUCCESS_FEE_HARD_CAP, but be defensive against drift.
  const cappedFee = Math.min(rawFee, SUCCESS_FEE_HARD_CAP.usdCents)

  // Clamp #2: subtract amounts already invoiced — idempotency on
  // retried paid events; only the new delta gets billed.
  const afterAlreadyInvoiced = cappedFee - Math.max(0, input.alreadyInvoicedSuccessFeeCents)

  // Clamp #3: remaining refund headroom after Stripe refunds to the
  // customer. realizedRefund - alreadyRefunded is the net refund we
  // can bill against.
  const headroom =
    input.realizedRefundCents - Math.max(0, input.alreadyRefundedToCustomerCents)
  const final = Math.min(afterAlreadyInvoiced, Math.max(0, headroom))
  return Math.max(0, final)
}

// --- generateSuccessFeeInvoice -------------------------------------

export interface GenerateSuccessFeeInvoiceInput {
  readonly caseId: string
  readonly realizedRefundCents: number
  readonly tier: PricingTier
  readonly rate?: number
}

export interface SuccessFeeInvoicedPayload {
  readonly caseId: string
  readonly invoiceId: string
  readonly amountUsdCents: number
  readonly tier: PricingTier
}

export interface GenerateSuccessFeeInvoiceDeps {
  readonly repo: PaymentRepo
  readonly publishInvoiceCreated: (payload: SuccessFeeInvoicedPayload) => Promise<void>
  readonly clock: () => Date
  readonly newInvoiceId?: () => string
}

export type GenerateSuccessFeeInvoiceResult =
  | { readonly outcome: 'created'; readonly payment: PaymentRecord }
  | {
      readonly outcome: 'skipped'
      readonly reason: 'no_remaining_fee'
      readonly amountUsdCents: 0
    }

export async function generateSuccessFeeInvoice(
  input: GenerateSuccessFeeInvoiceInput,
  deps: GenerateSuccessFeeInvoiceDeps,
): Promise<GenerateSuccessFeeInvoiceResult> {
  const history = await deps.repo.listPaymentsForCase(input.caseId)
  const alreadyInvoicedSuccessFeeCents = history
    .filter((p) => p.kind === 'success_fee_invoice')
    .reduce((sum, p) => sum + Math.max(0, p.amountUsdCents), 0)
  const alreadyRefundedToCustomerCents = history
    .filter((p) => p.kind === 'refund')
    .reduce((sum, p) => sum + Math.abs(Math.min(0, p.amountUsdCents)), 0)

  const amount = computeSuccessFeeInvoiceCents({
    realizedRefundCents: input.realizedRefundCents,
    tier: input.tier,
    rate: input.rate,
    alreadyInvoicedSuccessFeeCents,
    alreadyRefundedToCustomerCents,
  })

  if (amount <= 0) {
    return { outcome: 'skipped', reason: 'no_remaining_fee', amountUsdCents: 0 }
  }

  const invoiceId = (deps.newInvoiceId ?? defaultInvoiceId)()
  const result = await deps.repo.insertPayment({
    id: defaultPaymentId(),
    caseId: input.caseId,
    kind: 'success_fee_invoice',
    stripeEventId: null,
    stripeChargeId: null,
    stripeInvoiceId: invoiceId,
    sku: null,
    amountUsdCents: amount,
    currency: 'usd',
    status: 'pending',
    metadata: {
      tier: input.tier,
      realizedRefundCents: input.realizedRefundCents,
      rate: input.rate,
    },
    occurredAt: deps.clock(),
  })

  await deps.publishInvoiceCreated({
    caseId: input.caseId,
    invoiceId,
    amountUsdCents: amount,
    tier: input.tier,
  })

  return { outcome: 'created', payment: result.payment }
}

// --- defaults -------------------------------------------------------

let invoiceCounter = 0
function defaultInvoiceId(): string {
  invoiceCounter += 1
  return `inv_${Date.now().toString(36)}_${String(invoiceCounter).padStart(4, '0')}`
}

let paymentCounter = 0
function defaultPaymentId(): string {
  paymentCounter += 1
  return `pay_${Date.now().toString(36)}_${String(paymentCounter).padStart(4, '0')}`
}
