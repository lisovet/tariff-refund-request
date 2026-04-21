import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import {
  processedStripeEvents,
  type ProcessedStripeEventRow,
  type Schema,
} from '@shared/infra/db/schema'
import type { BillingRepo, MarkEventInput, MarkEventResult } from './repo'

type Db = PostgresJsDatabase<Schema>

/**
 * Drizzle BillingRepo. Per ADR 005: ON CONFLICT DO NOTHING on the
 * event_id PK is the dedupe primitive. The returned row count tells
 * us whether the insert won (firstSeen) or was a duplicate.
 */
export function createDrizzleBillingRepo(db: Db): BillingRepo {
  return {
    async markEventProcessed(input: MarkEventInput): Promise<MarkEventResult> {
      const rows = (await db
        .insert(processedStripeEvents)
        .values({
          eventId: input.eventId,
          eventType: input.eventType,
        })
        .onConflictDoNothing()
        .returning()) as ProcessedStripeEventRow[]
      return { firstSeen: rows.length > 0 }
    },
  }
}
