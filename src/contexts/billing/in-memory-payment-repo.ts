import type {
  InsertPaymentInput,
  InsertPaymentResult,
  PaymentRecord,
  PaymentRepo,
} from './payment-aggregate'

/**
 * In-memory PaymentRepo. Honors the UNIQUE (stripeEventId)
 * constraint by short-circuiting to outcome=duplicate when the event
 * id is already present (mirrors the Drizzle implementation).
 */

export function createInMemoryPaymentRepo(): PaymentRepo {
  const byId = new Map<string, PaymentRecord>()
  const byEventId = new Map<string, string>() // event id → payment id

  function toRecord(input: InsertPaymentInput): PaymentRecord {
    return {
      id: input.id,
      caseId: input.caseId,
      kind: input.kind,
      stripeEventId: input.stripeEventId,
      stripeChargeId: input.stripeChargeId,
      stripeInvoiceId: input.stripeInvoiceId,
      sku: input.sku,
      amountUsdCents: input.amountUsdCents,
      currency: input.currency,
      status: input.status,
      metadata: input.metadata,
      occurredAt: input.occurredAt,
    }
  }

  return {
    async insertPayment(input: InsertPaymentInput): Promise<InsertPaymentResult> {
      if (input.stripeEventId) {
        const existingId = byEventId.get(input.stripeEventId)
        if (existingId) {
          const existing = byId.get(existingId)
          if (existing) return { outcome: 'duplicate', payment: existing }
        }
      }
      const record = toRecord(input)
      byId.set(record.id, record)
      if (record.stripeEventId) byEventId.set(record.stripeEventId, record.id)
      return { outcome: 'created', payment: record }
    },
    async findPaymentByEventId(stripeEventId: string) {
      const id = byEventId.get(stripeEventId)
      return id ? byId.get(id) : undefined
    },
    async listPaymentsForCase(caseId: string) {
      return [...byId.values()]
        .filter((p) => p.caseId === caseId)
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    },
  }
}
