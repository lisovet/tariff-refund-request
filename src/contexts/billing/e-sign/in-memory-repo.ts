import type {
  MarkSignedInput,
  RecordPendingInput,
  SignedAgreementRecord,
  SignedAgreementRepo,
} from './types'

/**
 * In-memory {@link SignedAgreementRepo} for tests + local dev.
 * A Drizzle-backed counterpart lands when the signed_agreements
 * table is promoted from this adapter to a persisted migration.
 */
export function createInMemorySignedAgreementRepo(): SignedAgreementRepo {
  const byEnvelope = new Map<string, SignedAgreementRecord>()

  return {
    async recordPending(input: RecordPendingInput) {
      const record: SignedAgreementRecord = {
        envelopeId: input.envelopeId,
        caseId: input.caseId,
        sku: input.sku,
        agreementId: input.agreementId,
        agreementVersion: input.agreementVersion,
        signerEmail: input.signerEmail,
        signerName: input.signerName,
        renderedBody: input.renderedBody,
        status: 'pending',
        requestedAtIso: input.requestedAtIso,
        signedAtIso: null,
        signerIpHash: null,
      }
      byEnvelope.set(input.envelopeId, record)
      return record
    },
    async markSigned(input: MarkSignedInput) {
      const existing = byEnvelope.get(input.envelopeId)
      if (!existing) return undefined
      if (existing.status === 'signed') return existing
      const updated: SignedAgreementRecord = {
        ...existing,
        status: 'signed',
        signedAtIso: input.signedAtIso,
        signerIpHash: input.signerIpHash ?? null,
      }
      byEnvelope.set(input.envelopeId, updated)
      return updated
    },
    async findByEnvelope(envelopeId: string) {
      return byEnvelope.get(envelopeId)
    },
    async findSignedByCase(caseId: string) {
      return Array.from(byEnvelope.values()).filter(
        (r) => r.caseId === caseId && r.status === 'signed',
      )
    },
  }
}
