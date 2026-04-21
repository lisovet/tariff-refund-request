import { randomBytes } from 'node:crypto'
import type { EmailTransport, SendEmailInput, SendEmailResult } from './types'

/**
 * Console transport — used in dev / tests when RESEND_API_KEY is
 * missing. Logs the rendered email so a developer can see exactly
 * what would have been sent. Returns a synthetic id so callers can
 * still reason about delivery records.
 */

export function createConsoleTransport(): EmailTransport {
  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      const id = `console_${randomBytes(8).toString('hex')}`
      const recipients = Array.isArray(input.to) ? input.to.join(', ') : input.to
      console.log(
        '[email/console]',
        JSON.stringify(
          {
            id,
            from: input.from,
            to: recipients,
            subject: input.subject,
            // Keep the bodies short in the log; full content available via
            // the rendered template in tests.
            text: input.text.slice(0, 200),
            idempotencyKey: input.idempotencyKey,
          },
          null,
          2,
        ),
      )
      return { id, transport: 'console' }
    },
    isActive() {
      return false
    },
  }
}
