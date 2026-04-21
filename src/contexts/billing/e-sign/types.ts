import type { AgreementId, AgreementSku } from '../agreements/registry'

/**
 * E-sign provider adapter contract per PRD 10 §Engagement letters.
 *
 * The concrete adapter wraps a real provider (DocuSign, HelloSign,
 * BoldSign, PandaDoc…) — TODO(human-action). An in-memory
 * implementation backs unit tests + local dev.
 *
 * Real implementations MUST verify incoming webhook signatures
 * before accepting a `SignatureCompletedEvent`.
 */
export interface ESignProvider {
  requestSignature(input: ProviderRequestInput): Promise<ProviderRequestResult>
  verifyWebhook?(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): Promise<SignatureCompletedEvent>
}

export interface ProviderRequestInput {
  readonly agreementId: AgreementId
  readonly renderedBody: string
  readonly signerEmail: string
  readonly signerName: string
  readonly caseId: string
}

export interface ProviderRequestResult {
  readonly envelopeId: string
  readonly signingUrl: string
}

export interface SignatureCompletedEvent {
  readonly envelopeId: string
  readonly signedAtIso: string
  readonly signerIpHash?: string
}

/**
 * A signed-agreement record stored in our database. The PRD 10
 * retention policy treats these as permanent — they are the legal
 * basis for our compensation on Concierge engagements.
 */
export const SIGNED_AGREEMENT_STATUSES = ['pending', 'signed', 'voided'] as const
export type SignedAgreementStatus = (typeof SIGNED_AGREEMENT_STATUSES)[number]

export interface SignedAgreementRecord {
  readonly envelopeId: string
  readonly caseId: string
  readonly sku: AgreementSku
  readonly agreementId: AgreementId
  readonly agreementVersion: number
  readonly signerEmail: string
  readonly signerName: string
  readonly renderedBody: string
  readonly status: SignedAgreementStatus
  readonly requestedAtIso: string
  readonly signedAtIso: string | null
  readonly signerIpHash: string | null
}

export interface RecordPendingInput {
  readonly envelopeId: string
  readonly caseId: string
  readonly sku: AgreementSku
  readonly agreementId: AgreementId
  readonly agreementVersion: number
  readonly signerEmail: string
  readonly signerName: string
  readonly renderedBody: string
  readonly requestedAtIso: string
}

export interface MarkSignedInput {
  readonly envelopeId: string
  readonly signedAtIso: string
  readonly signerIpHash?: string
}

export interface SignedAgreementRepo {
  recordPending(input: RecordPendingInput): Promise<SignedAgreementRecord>
  markSigned(input: MarkSignedInput): Promise<SignedAgreementRecord | undefined>
  findByEnvelope(envelopeId: string): Promise<SignedAgreementRecord | undefined>
  findSignedByCase(caseId: string): Promise<readonly SignedAgreementRecord[]>
}
