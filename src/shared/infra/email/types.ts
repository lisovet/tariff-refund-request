/**
 * Email primitives. Per ADR 012: Resend for transactional + lifecycle.
 * Console transport for dev/tests when no Resend key is configured.
 */

export interface SendEmailInput {
  readonly from: string
  readonly to: string | readonly string[]
  readonly subject: string
  readonly html: string
  readonly text: string
  readonly replyTo?: string
  readonly headers?: Readonly<Record<string, string>>
  /** Idempotency key — Resend honours; console transport echoes it. */
  readonly idempotencyKey?: string
}

export interface SendEmailResult {
  readonly id: string
  readonly transport: 'resend' | 'console'
}

export interface EmailTransport {
  send(input: SendEmailInput): Promise<SendEmailResult>
  isActive(): boolean
}
