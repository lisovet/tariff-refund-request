import { createConsoleTransport } from './console-transport'
import { createResendTransport } from './resend-transport'
import type { EmailTransport } from './types'

/**
 * Email transport factory. Per ADR 012:
 *   - RESEND_API_KEY + EMAIL_FROM set → Resend transport.
 *   - RESEND_API_KEY missing → console transport (dev / tests).
 *   - RESEND_API_KEY set but EMAIL_FROM missing → throw (misconfigured).
 *
 * EMAIL_FROM is consumed by callers (templates pass it as the `from`
 * field on send), but the factory enforces its presence so we never
 * silently send from an unintended address.
 *
 * TODO(human-action): provision Resend, configure DKIM/SPF on the
 * sending domain, set RESEND_API_KEY + EMAIL_FROM in the environment.
 */

export type { EmailTransport, SendEmailInput, SendEmailResult } from './types'
export { createConsoleTransport } from './console-transport'
export { createResendTransport } from './resend-transport'
export { renderEmail, type RenderedEmail } from './render'
export { ScreenerResultsEmail } from './templates/ScreenerResultsEmail'
export { ScreenerNudge24hEmail } from './templates/ScreenerNudge24hEmail'
export { ScreenerNudge72hEmail } from './templates/ScreenerNudge72hEmail'

let cached: EmailTransport | undefined

export function getEmailTransport(): EmailTransport {
  if (cached) return cached
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    if (!process.env.EMAIL_FROM) {
      throw new Error(
        'RESEND_API_KEY is set but EMAIL_FROM is missing — refusing to send from an unintended address.',
      )
    }
    cached = createResendTransport({ apiKey })
  } else {
    cached = createConsoleTransport()
  }
  return cached
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? 'noreply@dev.tariff-refund.local'
}

/** Test-only: clear the cached transport so env changes can take effect. */
export function resetEmailTransport(): void {
  cached = undefined
}
