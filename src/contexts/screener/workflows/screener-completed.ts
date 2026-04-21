import {
  ScreenerResultsEmail,
  renderEmail,
  type EmailTransport,
} from '@shared/infra/email'
import { inngest } from '@shared/infra/inngest/client'
import { screenerCompleted } from '@shared/infra/inngest/events'

/**
 * Lifecycle workflow #1 per PRD 05: deliver the screener results
 * dossier as soon as the screener is complete.
 *
 * Per ADR 007: workflows are durable + replayable. The handler is
 * exported separately so unit tests bypass the Inngest wrapper.
 * Idempotent on the event's sessionId (Resend honours
 * idempotencyKey), so Inngest retries are safe.
 */

export interface ScreenerCompletedHandlerInput {
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
  }
}

export interface ScreenerCompletedHandlerDeps {
  readonly email: EmailTransport
  readonly fromAddress: string
}

export interface ScreenerCompletedResult {
  readonly delivered: boolean
  readonly messageId: string
}

export async function screenerCompletedHandler(
  input: ScreenerCompletedHandlerInput,
  deps: ScreenerCompletedHandlerDeps,
): Promise<ScreenerCompletedResult> {
  const { event, step } = input
  const { sessionId, email, company, magicLink } = event.data

  const rendered = await step.run('render-email', async () =>
    renderEmail(
      ScreenerResultsEmail({
        firstName: firstNameOf(company),
        resultsUrl: magicLink,
      }),
    ),
  )

  const result = await step.run('send-email', async () =>
    deps.email.send({
      from: deps.fromAddress,
      to: email,
      subject: 'Your screener results.',
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `screener-results:${sessionId}`,
    }),
  )

  return { delivered: true, messageId: result.id }
}

function firstNameOf(company: string | null): string | undefined {
  if (!company) return undefined
  const first = company.trim().split(/\s+/u)[0]
  return first && first.length <= 24 ? first : undefined
}

/**
 * Inngest-wrapped function. Resolves its email transport + from
 * address from the runtime env at invocation time so tests inject
 * stubs via the exported handler instead.
 */
export const screenerCompletedWorkflow = inngest.createFunction(
  { id: 'screener-completed', triggers: [screenerCompleted] },
  async (input) => {
    // Lazy imports keep the workflow registry light at module load.
    const { getEmailTransport, getEmailFrom } = await import('@shared/infra/email')
    // Inngest's runtime context types its event union to include the
    // synthetic 'inngest/function.invoked' event; the trigger filter
    // guarantees we only receive 'platform/screener.completed' here.
    // Cast through unknown to satisfy TS without weakening the handler
    // contract.
    const adapted = input as unknown as ScreenerCompletedHandlerInput
    return screenerCompletedHandler(adapted, {
      email: getEmailTransport(),
      fromAddress: getEmailFrom(),
    })
  },
)
