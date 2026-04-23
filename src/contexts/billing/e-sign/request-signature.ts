import { renderAgreement, resolveAgreement } from '../agreements/registry'
import type { AgreementSku } from '../agreements/registry'
import type { ESignProvider, SignedAgreementRepo } from './types'

/**
 * Start the Full Prep signature flow.
 *
 * Per PRD 10 §Acceptance criteria: "the engagement letter must be
 * e-signed before payment can be captured." This service:
 *
 *   1. Resolves the Full Prep agreement and renders it with the
 *      customer's variables.
 *   2. Requests a signature envelope via the {@link ESignProvider}
 *      (DocuSign / HelloSign in prod; in-memory in tests).
 *   3. Records the rendered body as an archival snapshot alongside
 *      `agreementId` + `version` in the signed-agreements repo.
 *   4. Returns the envelope id + signing URL for the customer.
 *
 * A subsequent webhook from the provider lands in
 * `handleSignatureCompleted`, which transitions the record to
 * `signed` and publishes `platform/concierge.signed` — the Inngest
 * event name is historical; it is the "engagement-letter-signed"
 * event for whatever tier currently requires e-sign.
 */

export interface RequestSignatureInput {
  readonly caseId: string
  readonly sku: AgreementSku
  readonly signerEmail: string
  readonly signerName: string
  readonly customerName: string
  readonly customerEmail: string
  readonly effectiveDateIso: string
  readonly companyLegalName: string
  readonly governingLawState: string
}

export interface RequestSignatureResult {
  readonly envelopeId: string
  readonly signingUrl: string
  readonly agreementId: 'full-prep-v1'
}

export interface RequestSignatureDeps {
  readonly repo: SignedAgreementRepo
  readonly provider: ESignProvider
  readonly clock?: () => Date
}

export async function requestConciergeSignature(
  input: RequestSignatureInput,
  deps: RequestSignatureDeps,
): Promise<RequestSignatureResult> {
  if (input.sku !== 'full-prep') {
    throw new Error(
      `requestConciergeSignature: only the full-prep SKU uses the e-sign flow (received ${input.sku})`,
    )
  }

  const agreement = resolveAgreement('full-prep')
  if (agreement.id !== 'full-prep-v1') {
    // TS narrowing: we know the registry shape today; if a v2 lands,
    // the return type widens + callers update. Guard for safety.
    throw new Error(`unexpected full-prep agreement id: ${agreement.id}`)
  }

  const renderedBody = renderAgreement('full-prep-v1', {
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    caseId: input.caseId,
    effectiveDateIso: input.effectiveDateIso,
    companyLegalName: input.companyLegalName,
    governingLawState: input.governingLawState,
  })

  const envelope = await deps.provider.requestSignature({
    agreementId: 'full-prep-v1',
    renderedBody,
    signerEmail: input.signerEmail,
    signerName: input.signerName,
    caseId: input.caseId,
  })

  const requestedAtIso = (deps.clock?.() ?? new Date()).toISOString()

  await deps.repo.recordPending({
    envelopeId: envelope.envelopeId,
    caseId: input.caseId,
    sku: 'full-prep',
    agreementId: 'full-prep-v1',
    agreementVersion: agreement.version,
    signerEmail: input.signerEmail,
    signerName: input.signerName,
    renderedBody,
    requestedAtIso,
  })

  return {
    envelopeId: envelope.envelopeId,
    signingUrl: envelope.signingUrl,
    agreementId: 'full-prep-v1',
  }
}
