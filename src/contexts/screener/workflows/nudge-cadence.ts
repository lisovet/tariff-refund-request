import {
  ScreenerNudge24hEmail,
  ScreenerNudge72hEmail,
  renderEmail,
  type EmailTransport,
} from '@shared/infra/email'
import { inngest } from '@shared/infra/inngest/client'
import { screenerCompleted } from '@shared/infra/inngest/events'

/**
 * Lifecycle nudge cadence per PRD 05 (24h + 72h).
 *
 *   t+0    screener.completed (workflow #1 sends results email)
 *   t+24h  if no purchase → send 24h nudge
 *   t+72h  if no purchase → send 72h nudge
 *
 * Cancellation: if a `platform/payment.completed` event arrives with
 * a matching screener `sessionId`, the cadence stops without sending
 * the remaining nudges.
 *
 * Per ADR 007: durable, replayable. Each `step.run` is idempotent on
 * its name + the sessionId-scoped idempotencyKey passed to Resend.
 */

export interface NudgeCadenceHandlerInput {
  readonly event: {
    id?: string
    data: {
      sessionId: string
      email: string
      company: string | null
      magicLink: string
    }
  }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
    sleep(id: string, ms: number): Promise<void>
    waitForEvent<T>(
      id: string,
      args: { event: string; timeout: string; if?: string },
    ): Promise<T | null>
  }
}

export interface NudgeCadenceHandlerDeps {
  readonly email: EmailTransport
  readonly fromAddress: string
  readonly howItWorksUrl?: string
}

export type CancelReason =
  | 'purchase-during-24h-window'
  | 'purchase-during-72h-window'

export interface NudgeCadenceResult {
  readonly delivered: ReadonlyArray<'nudge-24h' | 'nudge-72h'>
  readonly cancelledBy: CancelReason | null
}

export async function nudgeCadenceHandler(
  input: NudgeCadenceHandlerInput,
  deps: NudgeCadenceHandlerDeps,
): Promise<NudgeCadenceResult> {
  const { event, step } = input
  const { sessionId, email, company, magicLink } = event.data
  const howItWorksUrl = deps.howItWorksUrl ?? deriveHowItWorksUrl(magicLink)
  const delivered: Array<'nudge-24h' | 'nudge-72h'> = []

  // Window 1 — wait 24h, cancel if purchase event arrives in that window.
  const purchasedDuring24h = await step.waitForEvent('wait-purchase-24h', {
    event: 'platform/payment.completed',
    timeout: '24h',
    if: `async.data.sessionId == "${sessionId}"`,
  })
  if (purchasedDuring24h) {
    return { delivered, cancelledBy: 'purchase-during-24h-window' }
  }

  await step.run('send-24h-nudge', async () => {
    const rendered = await renderEmail(
      ScreenerNudge24hEmail({
        firstName: firstNameOf(company),
        resultsUrl: magicLink,
        howItWorksUrl,
      }),
    )
    return deps.email.send({
      from: deps.fromAddress,
      to: email,
      subject: 'A quick note about your screener results.',
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `screener-nudge-24h:${sessionId}`,
    })
  })
  delivered.push('nudge-24h')

  // Window 2 — wait 48 more hours, cancel if purchase arrives.
  const purchasedDuring72h = await step.waitForEvent('wait-purchase-72h', {
    event: 'platform/payment.completed',
    timeout: '48h',
    if: `async.data.sessionId == "${sessionId}"`,
  })
  if (purchasedDuring72h) {
    return { delivered, cancelledBy: 'purchase-during-72h-window' }
  }

  await step.run('send-72h-nudge', async () => {
    const rendered = await renderEmail(
      ScreenerNudge72hEmail({
        firstName: firstNameOf(company),
        resultsUrl: magicLink,
      }),
    )
    return deps.email.send({
      from: deps.fromAddress,
      to: email,
      subject: 'The hard part isn\'t the math. It\'s the records.',
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `screener-nudge-72h:${sessionId}`,
    })
  })
  delivered.push('nudge-72h')

  return { delivered, cancelledBy: null }
}

function firstNameOf(company: string | null): string | undefined {
  if (!company) return undefined
  const first = company.trim().split(/\s+/u)[0]
  return first && first.length <= 24 ? first : undefined
}

function deriveHowItWorksUrl(magicLink: string): string {
  try {
    const url = new URL(magicLink)
    return `${url.protocol}//${url.host}/how-it-works`
  } catch {
    return '/how-it-works'
  }
}

/**
 * Inngest-wrapped function. Triggered by platform/screener.completed;
 * runs in parallel with the screener-completed workflow (the results
 * email goes out immediately, the nudges wait).
 */
export const nudgeCadenceWorkflow = inngest.createFunction(
  { id: 'screener-nudge-cadence', triggers: [screenerCompleted] },
  async (input) => {
    const { getEmailTransport, getEmailFrom } = await import('@shared/infra/email')
    const adapted = input as unknown as NudgeCadenceHandlerInput
    return nudgeCadenceHandler(adapted, {
      email: getEmailTransport(),
      fromAddress: getEmailFrom(),
    })
  },
)
