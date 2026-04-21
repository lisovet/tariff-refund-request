import type { ESignProvider, ProviderRequestInput, ProviderRequestResult } from './types'

/**
 * In-memory e-sign provider for tests + local dev. Produces a
 * monotonically unique envelope id + a signing-URL placeholder.
 * TODO(human-action): select a production provider (DocuSign,
 * HelloSign, BoldSign, PandaDoc) and implement the real adapter —
 * once selected, the real adapter conforms to {@link ESignProvider}
 * and this stub remains the test/dev seam.
 */
export function createInMemoryESignProvider(): ESignProvider {
  let counter = 0
  return {
    async requestSignature(
      input: ProviderRequestInput,
    ): Promise<ProviderRequestResult> {
      counter += 1
      const envelopeId = `env_memory_${counter}_${input.caseId}`
      return {
        envelopeId,
        signingUrl: `https://local-esign.test/sign?envelope=${encodeURIComponent(envelopeId)}`,
      }
    },
  }
}
