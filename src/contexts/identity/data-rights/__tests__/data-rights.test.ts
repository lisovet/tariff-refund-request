import { describe, expect, it, vi } from 'vitest'
import {
  DELETION_SLA_DAYS,
  exportCustomerData,
  processPendingDeletions,
  requestCustomerDeletion,
  createInMemoryDeletionRepo,
  type DeletionRepo,
  type ExportCustomerDataDeps,
  type GlobalAuditSink,
  type GlobalAuditSinkInput,
} from '../index'
import { createInMemoryIdentityRepo } from '../../in-memory-repo'
import { createInMemoryCaseRepo } from '@contexts/ops/server'

/**
 * Data rights — customer export + deletion per PRD 10.
 *
 * Export: full JSON of the customer identity + every case they
 * own + every audit entry for those cases. Secrets (clerkUserId,
 * actorIds) are preserved because the export is delivered only to
 * the authenticated customer or an admin acting on their behalf;
 * the signed URL delivering the file is short-lived.
 *
 * Deletion: queued, then processed within DELETION_SLA_DAYS. The
 * worker writes a content-free audit row (counts only) before
 * purging — so the deletion is recorded but the contents are not
 * retained.
 */

const NOW = new Date('2026-04-21T14:00:00.000Z')

async function setupCustomerWithCases(): Promise<{
  customerId: string
  deps: ExportCustomerDataDeps
  caseRepo: ReturnType<typeof createInMemoryCaseRepo>
  identityRepo: ReturnType<typeof createInMemoryIdentityRepo>
}> {
  const identityRepo = createInMemoryIdentityRepo()
  const caseRepo = createInMemoryCaseRepo()
  const customer = await identityRepo.upsertCustomer({
    clerkUserId: 'user_abc',
    email: 'finance@acme.test',
    fullName: 'Dana Finance',
  })
  const c1 = await caseRepo.createCase({ tier: 'smb', customerId: customer.id })
  const c2 = await caseRepo.createCase({ tier: 'smb', customerId: customer.id })
  await caseRepo.appendAuditEntry({
    caseId: c1.id,
    actorId: 'stf_v',
    kind: 'admin.note',
    payload: { note: 'First audit entry' },
    occurredAt: new Date('2026-04-21T12:00:00.000Z'),
  })
  await caseRepo.appendAuditEntry({
    caseId: c2.id,
    actorId: null,
    kind: 'system.ping',
    payload: { source: 'workflow' },
    occurredAt: new Date('2026-04-21T13:00:00.000Z'),
  })
  return {
    customerId: customer.id,
    deps: { identityRepo, caseRepo },
    caseRepo,
    identityRepo,
  }
}

describe('exportCustomerData', () => {
  it('returns the customer identity + every case + every audit entry', async () => {
    const { customerId, deps } = await setupCustomerWithCases()
    const result = await exportCustomerData({ customerId }, deps)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.export.customer.id).toBe(customerId)
    expect(result.export.customer.email).toBe('finance@acme.test')
    expect(result.export.cases).toHaveLength(2)
    const audit = result.export.cases.flatMap((c) => c.auditEntries)
    expect(audit).toHaveLength(2)
    // Exports are JSON-serializable (dates become ISO strings).
    const roundTripped = JSON.parse(JSON.stringify(result.export)) as typeof result.export
    expect(roundTripped.customer.email).toBe('finance@acme.test')
  })

  it('fails with customer_not_found when the customer does not exist', async () => {
    const { deps } = await setupCustomerWithCases()
    const result = await exportCustomerData({ customerId: 'cus_does_not_exist' }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('customer_not_found')
  })

  it('returns an empty cases array when the customer has none', async () => {
    const identityRepo = createInMemoryIdentityRepo()
    const caseRepo = createInMemoryCaseRepo()
    const c = await identityRepo.upsertCustomer({
      clerkUserId: 'user_x',
      email: 'x@y.test',
      fullName: null,
    })
    const result = await exportCustomerData(
      { customerId: c.id },
      { identityRepo, caseRepo },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.export.cases).toEqual([])
  })

  it('serializes dates as ISO strings (stable JSON shape)', async () => {
    const { customerId, deps } = await setupCustomerWithCases()
    const result = await exportCustomerData({ customerId }, deps)
    if (!result.ok) throw new Error('unreachable')
    for (const c of result.export.cases) {
      expect(typeof c.createdAt).toBe('string')
      expect(c.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u)
    }
  })
})

describe('requestCustomerDeletion', () => {
  it('queues a deletion request with a scheduled date 30 days out', async () => {
    const repo: DeletionRepo = createInMemoryDeletionRepo()
    const r = await requestCustomerDeletion(
      { customerId: 'cus_1', reason: 'customer-initiated' },
      { deletionRepo: repo, clock: () => NOW },
    )
    expect(r.request.customerId).toBe('cus_1')
    expect(r.request.status).toBe('queued')
    expect(r.request.scheduledFor).toEqual(
      new Date(NOW.getTime() + DELETION_SLA_DAYS * 24 * 60 * 60 * 1000),
    )
    expect(r.replay).toBe(false)
  })

  it('is idempotent — a second request for the same customer returns the existing queued record', async () => {
    const repo = createInMemoryDeletionRepo()
    const first = await requestCustomerDeletion(
      { customerId: 'cus_1', reason: 'customer-initiated' },
      { deletionRepo: repo, clock: () => NOW },
    )
    const second = await requestCustomerDeletion(
      { customerId: 'cus_1', reason: 'customer-initiated' },
      { deletionRepo: repo, clock: () => NOW },
    )
    expect(second.request.id).toBe(first.request.id)
    expect(second.replay).toBe(true)
  })
})

describe('processPendingDeletions', () => {
  it('purges cases + audit rows + customer + writes a content-free deletion audit entry', async () => {
    const { customerId, deps, caseRepo, identityRepo } = await setupCustomerWithCases()
    const deletionRepo = createInMemoryDeletionRepo()
    await requestCustomerDeletion(
      { customerId, reason: 'customer-initiated' },
      { deletionRepo, clock: () => NOW },
    )
    const globalAuditSink = vi.fn<GlobalAuditSink>(
      async (_i: GlobalAuditSinkInput) => 'audit_global_1',
    )
    const later = new Date(NOW.getTime() + (DELETION_SLA_DAYS + 1) * 24 * 60 * 60 * 1000)

    const result = await processPendingDeletions(later, {
      deletionRepo,
      caseRepo: deps.caseRepo,
      identityRepo: deps.identityRepo,
      globalAuditSink,
    })

    expect(result.processedCount).toBe(1)
    expect(result.results[0]?.ok).toBe(true)
    expect(result.results[0]?.casesDeleted).toBe(2)
    expect(result.results[0]?.auditRowsDeleted).toBe(2)
    expect(result.results[0]?.customerDeleted).toBe(true)

    // Global deletion-log entry written once with content-free counts.
    expect(globalAuditSink).toHaveBeenCalledTimes(1)
    const auditPayload = globalAuditSink.mock.calls[0]?.[0]
    expect(auditPayload?.kind).toBe('customer.deleted')
    expect(auditPayload?.customerId).toBe(customerId)
    expect(auditPayload?.counts).toEqual({
      casesDeleted: 2,
      auditRowsDeleted: 2,
    })
    // NO content fields on the audit row.
    expect(auditPayload).not.toHaveProperty('email')
    expect(auditPayload).not.toHaveProperty('fullName')

    // Effects: cases gone, customer gone.
    expect(await caseRepo.listCasesByCustomer(customerId)).toEqual([])
    expect(await identityRepo.findCustomerByClerkUserId('user_abc')).toBeNull()

    // Request transitioned to `processed`.
    const q = await deletionRepo.listByStatus('queued')
    expect(q).toEqual([])
    const done = await deletionRepo.listByStatus('processed')
    expect(done).toHaveLength(1)
  })

  it('does not touch requests whose scheduled date has not yet arrived', async () => {
    const { customerId, deps } = await setupCustomerWithCases()
    const deletionRepo = createInMemoryDeletionRepo()
    await requestCustomerDeletion(
      { customerId, reason: 'customer-initiated' },
      { deletionRepo, clock: () => NOW },
    )
    const globalAuditSink = vi.fn<GlobalAuditSink>(
      async (_i: GlobalAuditSinkInput) => 'audit_global_1',
    )
    const tooEarly = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000)

    const result = await processPendingDeletions(tooEarly, {
      deletionRepo,
      caseRepo: deps.caseRepo,
      identityRepo: deps.identityRepo,
      globalAuditSink,
    })

    expect(result.processedCount).toBe(0)
    expect(globalAuditSink).not.toHaveBeenCalled()
  })

  it('is idempotent — running again after processing yields zero additional work', async () => {
    const { customerId, deps } = await setupCustomerWithCases()
    const deletionRepo = createInMemoryDeletionRepo()
    await requestCustomerDeletion(
      { customerId, reason: 'customer-initiated' },
      { deletionRepo, clock: () => NOW },
    )
    const globalAuditSink = vi.fn<GlobalAuditSink>(
      async (_i: GlobalAuditSinkInput) => 'audit_global_1',
    )
    const later = new Date(NOW.getTime() + (DELETION_SLA_DAYS + 1) * 24 * 60 * 60 * 1000)
    await processPendingDeletions(later, {
      deletionRepo,
      caseRepo: deps.caseRepo,
      identityRepo: deps.identityRepo,
      globalAuditSink,
    })
    const second = await processPendingDeletions(later, {
      deletionRepo,
      caseRepo: deps.caseRepo,
      identityRepo: deps.identityRepo,
      globalAuditSink,
    })
    expect(second.processedCount).toBe(0)
    expect(globalAuditSink).toHaveBeenCalledTimes(1)
  })
})
