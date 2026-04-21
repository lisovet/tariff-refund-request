import 'server-only'
import { asc, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { payments, type Schema } from '@shared/infra/db/schema'
import type {
  InsertPaymentInput,
  InsertPaymentResult,
  PaymentRecord,
  PaymentRepo,
} from './payment-aggregate'

/**
 * Drizzle-backed PaymentRepo. The UNIQUE (stripe_event_id) constraint
 * is enforced at the schema level; race-aware insert: pre-check by
 * event id, fall back to the unique-violation catch + re-look-up.
 */

export function createDrizzlePaymentRepo(
  db: PostgresJsDatabase<Schema>,
): PaymentRepo {
  return {
    async insertPayment(input: InsertPaymentInput): Promise<InsertPaymentResult> {
      if (input.stripeEventId) {
        const existing = await findByEventId(db, input.stripeEventId)
        if (existing) return { outcome: 'duplicate', payment: existing }
      }
      try {
        const inserted = await db
          .insert(payments)
          .values({
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
          })
          .returning()
        const row = inserted[0]
        if (!row) throw new Error('insertPayment: insert returned no rows')
        return { outcome: 'created', payment: mapRow(row) }
      } catch (err) {
        if (input.stripeEventId) {
          const racy = await findByEventId(db, input.stripeEventId)
          if (racy) return { outcome: 'duplicate', payment: racy }
        }
        throw err
      }
    },
    async findPaymentByEventId(stripeEventId: string) {
      return findByEventId(db, stripeEventId)
    },
    async listPaymentsForCase(caseId: string) {
      const rows = await db
        .select()
        .from(payments)
        .where(eq(payments.caseId, caseId))
        .orderBy(asc(payments.occurredAt))
      return rows.map(mapRow)
    },
  }
}

async function findByEventId(
  db: PostgresJsDatabase<Schema>,
  stripeEventId: string,
): Promise<PaymentRecord | undefined> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.stripeEventId, stripeEventId))
    .limit(1)
  const row = rows[0]
  return row ? mapRow(row) : undefined
}

type PaymentDbRow = typeof payments.$inferSelect

function mapRow(row: PaymentDbRow): PaymentRecord {
  return {
    id: row.id,
    caseId: row.caseId,
    kind: row.kind,
    stripeEventId: row.stripeEventId,
    stripeChargeId: row.stripeChargeId,
    stripeInvoiceId: row.stripeInvoiceId,
    sku: row.sku,
    amountUsdCents: Number(row.amountUsdCents),
    currency: row.currency,
    status: row.status,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    occurredAt: row.occurredAt,
  }
}
