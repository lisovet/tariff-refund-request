import type { SignedAgreementRecord, SignedAgreementRepo } from './types'
import type { AgreementId, AgreementSku } from '../agreements/registry'

/**
 * Signature-completed webhook handler. Idempotent on envelope id:
 * a second delivery of the same webhook is detected via the record's
 * existing `status === 'signed'` state and is reported back as a
 * replay (so the caller doesn't re-trigger downstream work).
 *
 * On first-write success, publishes the `platform/concierge.signed`
 * event; the Inngest workflow wired to that event opens the Stripe
 * Checkout session. This is the PAYMENT GATE — checkout CANNOT
 * fire until this handler has observed a signed envelope.
 */

export interface HandleSignatureInput {
  readonly envelopeId: string
  readonly signedAtIso: string
  readonly signerIpHash?: string
}

export interface ConciergeSignedEventData {
  readonly caseId: string
  readonly sku: AgreementSku
  readonly agreementId: AgreementId
  readonly agreementVersion: number
  readonly envelopeId: string
  readonly signedAtIso: string
  readonly signerEmail: string
  readonly signerName: string
}

export interface HandleSignatureDeps {
  readonly repo: SignedAgreementRepo
  readonly publishConciergeSigned: (
    event: ConciergeSignedEventData,
  ) => Promise<void>
}

export type HandleSignatureResult =
  | {
      readonly ok: true
      readonly record: SignedAgreementRecord
      readonly replayed: boolean
    }
  | {
      readonly ok: false
      readonly reason: 'envelope_not_found'
    }

export async function handleSignatureCompleted(
  input: HandleSignatureInput,
  deps: HandleSignatureDeps,
): Promise<HandleSignatureResult> {
  const existing = await deps.repo.findByEnvelope(input.envelopeId)
  if (!existing) {
    return { ok: false, reason: 'envelope_not_found' }
  }

  // Idempotency: already-signed envelopes short-circuit without
  // republishing the event. Provider replays are common.
  if (existing.status === 'signed') {
    return { ok: true, record: existing, replayed: true }
  }

  const updated = await deps.repo.markSigned({
    envelopeId: input.envelopeId,
    signedAtIso: input.signedAtIso,
    signerIpHash: input.signerIpHash,
  })

  if (!updated) {
    // Race condition: record existed on the read but was voided / deleted
    // before we could write. Surface as a fresh "not found" so the
    // provider retries.
    return { ok: false, reason: 'envelope_not_found' }
  }

  await deps.publishConciergeSigned({
    caseId: updated.caseId,
    sku: updated.sku,
    agreementId: updated.agreementId,
    agreementVersion: updated.agreementVersion,
    envelopeId: updated.envelopeId,
    signedAtIso: input.signedAtIso,
    signerEmail: updated.signerEmail,
    signerName: updated.signerName,
  })

  return { ok: true, record: updated, replayed: false }
}
