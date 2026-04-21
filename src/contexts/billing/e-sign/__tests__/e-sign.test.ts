import { describe, expect, it, vi } from 'vitest'
import {
  createInMemoryESignProvider,
  createInMemorySignedAgreementRepo,
  handleSignatureCompleted,
  requestConciergeSignature,
  type ConciergeCheckoutGate,
  type ConciergeSignedEventData,
  type ESignProvider,
  type HandleSignatureInput,
  type RequestSignatureInput,
  type SignedAgreementRepo,
} from '../index'

const BASE_INPUT: RequestSignatureInput = {
  caseId: 'cas_c1',
  sku: 'concierge',
  signerEmail: 'controller@acme.test',
  signerName: 'Dana Finance',
  customerName: 'Acme Imports LLC',
  customerEmail: 'controller@acme.test',
  effectiveDateIso: '2026-04-21',
  companyLegalName: 'Takemaya Software, Inc.',
  governingLawState: 'Delaware',
}

describe('requestConciergeSignature', () => {
  it('renders the concierge-v1 agreement + requests an envelope + records pending state', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const provider = createInMemoryESignProvider()
    const result = await requestConciergeSignature(BASE_INPUT, { repo, provider })
    expect(result.envelopeId.startsWith('env_')).toBe(true)
    expect(result.signingUrl.length).toBeGreaterThan(0)
    expect(result.agreementId).toBe('concierge-v1')

    const pending = await repo.findByEnvelope(result.envelopeId)
    expect(pending).toBeDefined()
    expect(pending?.status).toBe('pending')
    expect(pending?.agreementId).toBe('concierge-v1')
    expect(pending?.agreementVersion).toBe(1)
    expect(pending?.caseId).toBe('cas_c1')
    expect(pending?.sku).toBe('concierge')
    expect(pending?.signerEmail).toBe('controller@acme.test')
    // Archival snapshot of the rendered body — so if the template
    // drifts later, the signed copy still carries the customer's
    // actually-accepted terms.
    expect(pending?.renderedBody.length).toBeGreaterThan(500)
    expect(pending?.renderedBody).toContain('Acme Imports LLC')
    expect(pending?.renderedBody).not.toMatch(/\{\{[A-Z_]+\}\}/)
  })

  it('refuses non-concierge SKUs (lightweight clickwrap does not use this flow)', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const provider = createInMemoryESignProvider()
    await expect(
      requestConciergeSignature(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...BASE_INPUT, sku: 'recovery-kit' as any },
        { repo, provider },
      ),
    ).rejects.toThrow(/concierge/i)
  })
})

describe('handleSignatureCompleted', () => {
  it('transitions the pending record to signed + publishes concierge.signed event', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const provider = createInMemoryESignProvider()
    const { envelopeId } = await requestConciergeSignature(BASE_INPUT, {
      repo,
      provider,
    })
    const publishConciergeSigned = vi.fn<
      (e: ConciergeSignedEventData) => Promise<void>
    >(async () => {})
    const input: HandleSignatureInput = {
      envelopeId,
      signedAtIso: '2026-04-21T14:00:00.000Z',
      signerIpHash: 'sha256-abc',
    }
    const result = await handleSignatureCompleted(input, {
      repo,
      publishConciergeSigned,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.record.status).toBe('signed')
    expect(result.record.signedAtIso).toBe('2026-04-21T14:00:00.000Z')
    expect(publishConciergeSigned).toHaveBeenCalledTimes(1)
    const payload = publishConciergeSigned.mock.calls[0]?.[0]
    expect(payload?.caseId).toBe('cas_c1')
    expect(payload?.sku).toBe('concierge')
    expect(payload?.agreementId).toBe('concierge-v1')
    expect(payload?.envelopeId).toBe(envelopeId)
  })

  it('is idempotent on envelope id — a second delivery is a no-op + does NOT republish', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const provider = createInMemoryESignProvider()
    const { envelopeId } = await requestConciergeSignature(BASE_INPUT, {
      repo,
      provider,
    })
    const publishConciergeSigned = vi.fn<
      (e: ConciergeSignedEventData) => Promise<void>
    >(async () => {})
    const once: HandleSignatureInput = {
      envelopeId,
      signedAtIso: '2026-04-21T14:00:00.000Z',
    }
    await handleSignatureCompleted(once, { repo, publishConciergeSigned })
    const second = await handleSignatureCompleted(once, {
      repo,
      publishConciergeSigned,
    })
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error('unreachable')
    expect(second.replayed).toBe(true)
    expect(publishConciergeSigned).toHaveBeenCalledTimes(1)
  })

  it('rejects an unknown envelope id (no pending record → no signature)', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const publishConciergeSigned = vi.fn<
      (e: ConciergeSignedEventData) => Promise<void>
    >(async () => {})
    const result = await handleSignatureCompleted(
      { envelopeId: 'env_does_not_exist', signedAtIso: '2026-04-21T14:00:00.000Z' },
      { repo, publishConciergeSigned },
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('envelope_not_found')
    expect(publishConciergeSigned).not.toHaveBeenCalled()
  })
})

describe('ConciergeCheckoutGate — payment cannot capture before signature', () => {
  it('gateCheckout() refuses when no signed agreement exists for the case', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const gate: ConciergeCheckoutGate = { repo }
    const { canProceed, reason } = await gate.repo
      .findSignedByCase('cas_c1')
      .then((records) => ({
        canProceed: records.length > 0,
        reason: records.length > 0 ? undefined : 'no_signed_agreement',
      }))
    expect(canProceed).toBe(false)
    expect(reason).toBe('no_signed_agreement')
  })

  it('gateCheckout() permits once the signature has been recorded', async () => {
    const repo = createInMemorySignedAgreementRepo()
    const provider = createInMemoryESignProvider()
    const { envelopeId } = await requestConciergeSignature(BASE_INPUT, {
      repo,
      provider,
    })
    await handleSignatureCompleted(
      { envelopeId, signedAtIso: '2026-04-21T14:00:00.000Z' },
      { repo, publishConciergeSigned: vi.fn(async () => {}) },
    )
    const records = await repo.findSignedByCase('cas_c1')
    expect(records).toHaveLength(1)
    expect(records[0]?.sku).toBe('concierge')
  })
})

describe('createInMemoryESignProvider', () => {
  it('produces stable envelope ids + signing URLs per request', async () => {
    const provider: ESignProvider = createInMemoryESignProvider()
    const a = await provider.requestSignature({
      agreementId: 'concierge-v1',
      renderedBody: '# A',
      signerEmail: 'x@y.test',
      signerName: 'X',
      caseId: 'cas_1',
    })
    const b = await provider.requestSignature({
      agreementId: 'concierge-v1',
      renderedBody: '# B',
      signerEmail: 'x@y.test',
      signerName: 'X',
      caseId: 'cas_1',
    })
    expect(a.envelopeId).not.toBe(b.envelopeId)
    expect(a.signingUrl.startsWith('https://')).toBe(true)
  })
})

describe('createInMemorySignedAgreementRepo', () => {
  it('findByEnvelope returns undefined for unknown ids', async () => {
    const repo: SignedAgreementRepo = createInMemorySignedAgreementRepo()
    expect(await repo.findByEnvelope('env_x')).toBeUndefined()
  })

  it('findSignedByCase returns only signed records (pending excluded)', async () => {
    const repo = createInMemorySignedAgreementRepo()
    await repo.recordPending({
      envelopeId: 'env_pending',
      caseId: 'cas_gate',
      agreementId: 'concierge-v1',
      agreementVersion: 1,
      sku: 'concierge',
      signerEmail: 'e@e.test',
      signerName: 'E',
      renderedBody: '...body...',
      requestedAtIso: '2026-04-21T13:00:00.000Z',
    })
    expect(await repo.findSignedByCase('cas_gate')).toEqual([])
    const updated = await repo.markSigned({
      envelopeId: 'env_pending',
      signedAtIso: '2026-04-21T14:00:00.000Z',
    })
    expect(updated?.status).toBe('signed')
    const signed = await repo.findSignedByCase('cas_gate')
    expect(signed).toHaveLength(1)
  })
})
