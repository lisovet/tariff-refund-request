import { inngest } from '../client'
import { platformSmokeHello } from '../events'

/**
 * Smoke workflow used by the dev-server health check. Verifies the
 * Inngest pipeline is wired correctly without depending on any
 * platform context. Downstream tasks add real workflows next to the
 * domain code they serve (e.g., src/contexts/<context>/workflows/).
 *
 * The handler is exported separately so it can be tested as a plain
 * async function (Inngest's wrapper internals are not test surface).
 */

export interface SmokeHandlerInput {
  readonly event: { id?: string; data: { who: string } }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
  }
}

export async function smokeHelloWorldHandler(input: SmokeHandlerInput) {
  const { event, step } = input
  return {
    greeting: await step.run('compose-greeting', () => `hello, ${event.data.who}`),
    observedEventId: event.id,
  }
}

export const smokeHelloWorld = inngest.createFunction(
  { id: 'smoke-hello-world', triggers: [platformSmokeHello] },
  smokeHelloWorldHandler,
)
