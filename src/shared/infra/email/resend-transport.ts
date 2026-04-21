import { Resend } from 'resend'
import type { EmailTransport, SendEmailInput, SendEmailResult } from './types'

/**
 * Resend-backed transport. Per ADR 012: lifecycle scheduling lives in
 * Inngest (not Resend's broadcast API) — this transport only delivers
 * one-shot transactional sends.
 */

export interface ResendConfig {
  readonly apiKey: string
}

export function createResendTransport(config: ResendConfig): EmailTransport {
  const client = new Resend(config.apiKey)
  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      const response = await client.emails.send(
        {
          from: input.from,
          to: Array.isArray(input.to) ? [...input.to] : [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          replyTo: input.replyTo,
          headers: input.headers
            ? { ...input.headers }
            : undefined,
        },
        input.idempotencyKey
          ? { idempotencyKey: input.idempotencyKey }
          : undefined,
      )
      if (response.error) {
        throw new Error(
          `Resend error: ${response.error.name} — ${response.error.message}`,
        )
      }
      const id = response.data?.id
      if (!id) throw new Error('Resend returned no message id')
      return { id, transport: 'resend' }
    },
    isActive() {
      return true
    },
  }
}
