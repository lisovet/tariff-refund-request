import { serve } from 'inngest/next'
import { inngest } from '@shared/infra/inngest/client'
import { workflows } from '@shared/infra/inngest/workflows'

/**
 * Inngest serve route — receives the dev server's invocations and
 * dispatches to the registered workflows. Per ADR 007.
 *
 * Local dev: run `npx inngest-cli@latest dev` alongside `npm run dev`;
 * the dev server polls this route and replays events visibly.
 */

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...workflows],
})
