import type { BillingRepo, MarkEventInput, MarkEventResult } from './repo'

/**
 * In-memory BillingRepo for tests + dev fallback. Mirrors the Drizzle
 * repo's ON CONFLICT semantics: insert wins on first call, returns
 * `firstSeen: false` thereafter.
 */
export function createInMemoryBillingRepo(): BillingRepo {
  const seen = new Set<string>()
  return {
    async markEventProcessed(input: MarkEventInput): Promise<MarkEventResult> {
      if (seen.has(input.eventId)) return { firstSeen: false }
      seen.add(input.eventId)
      return { firstSeen: true }
    },
  }
}
