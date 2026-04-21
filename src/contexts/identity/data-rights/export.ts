import type {
  CustomerExport,
  ExportCustomerDataDeps,
  ExportCustomerDataInput,
  ExportCustomerDataResult,
} from './types'

/**
 * Materialize a customer's entire data footprint as a JSON export.
 *
 * v1 includes: customer identity, every owned case, and the full
 * audit history per case. Satellite surfaces (documents, entries,
 * payments) layer into this union as their repos land the
 * by-customer list methods.
 *
 * The return shape is JSON-safe — Dates are ISO strings. The
 * caller is responsible for serializing + putting the artifact
 * where the customer can retrieve it (signed URL, email with an
 * attachment, etc.).
 */
export async function exportCustomerData(
  input: ExportCustomerDataInput,
  deps: ExportCustomerDataDeps,
): Promise<ExportCustomerDataResult> {
  const customer = await deps.identityRepo.findCustomerById(input.customerId)
  if (!customer) return { ok: false, reason: 'customer_not_found' }

  const rawCases = await deps.caseRepo.listCasesByCustomer(input.customerId)

  const cases = await Promise.all(
    rawCases.map(async (c) => {
      const audit = await deps.caseRepo.listAudit(c.id)
      return {
        id: c.id,
        state: c.state,
        tier: c.tier,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        auditEntries: audit.map((a) => ({
          id: a.id,
          kind: a.kind,
          actorId: a.actorId,
          fromState: a.fromState,
          toState: a.toState,
          occurredAt: a.occurredAt.toISOString(),
          payload: a.payload,
        })),
      }
    }),
  )

  const payload: CustomerExport = {
    exportedAt: new Date().toISOString(),
    customer: {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      createdAt: customer.createdAt.toISOString(),
    },
    cases,
  }

  return { ok: true, export: payload }
}
