import { randomBytes } from 'node:crypto'
import type { DeletionRepo, DeletionRequest, DeletionRequestStatus } from './types'

/**
 * In-memory {@link DeletionRepo} — drives unit tests and local dev.
 * A Drizzle counterpart + migration (`customer_deletion_requests`
 * table) lands when this surface is cut over to Postgres.
 */
export function createInMemoryDeletionRepo(): DeletionRepo {
  const byId = new Map<string, DeletionRequest>()

  return {
    async enqueue(input) {
      for (const r of byId.values()) {
        if (r.customerId === input.customerId && r.status === 'queued') {
          return { request: r, replay: true }
        }
      }
      const request: DeletionRequest = {
        id: `ddel_${randomBytes(6).toString('hex')}`,
        customerId: input.customerId,
        requestedAt: input.requestedAt,
        scheduledFor: input.scheduledFor,
        reason: input.reason,
        status: 'queued',
        processedAt: null,
      }
      byId.set(request.id, request)
      return { request, replay: false }
    },
    async markProcessed(id, processedAt) {
      const existing = byId.get(id)
      if (!existing) return undefined
      const updated: DeletionRequest = {
        ...existing,
        status: 'processed',
        processedAt,
      }
      byId.set(id, updated)
      return updated
    },
    async listByStatus(status: DeletionRequestStatus) {
      return Array.from(byId.values()).filter((r) => r.status === status)
    },
    async findByCustomer(customerId) {
      for (const r of byId.values()) {
        if (r.customerId === customerId && r.status !== 'cancelled') return r
      }
      return undefined
    },
  }
}
