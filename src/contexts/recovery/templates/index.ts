import type { RecoveryPath } from '../routing'
import { ACE_TEMPLATE } from './ace'
import { BROKER_TEMPLATE } from './broker'
import { CARRIER_TEMPLATE } from './carrier'
import { MIXED_TEMPLATE } from './mixed'
import type {
  OutreachKitTemplate,
  OutreachKitTokens,
  RenderedOutreachKit,
} from './types'

export { OUTREACH_TEMPLATE_VERSION } from './types'
export type {
  OutreachKitTemplate,
  OutreachKitTokens,
  RenderedOutreachKit,
} from './types'

export const OUTREACH_KIT_TEMPLATES: Readonly<Record<RecoveryPath, OutreachKitTemplate>> = {
  broker: BROKER_TEMPLATE,
  carrier: CARRIER_TEMPLATE,
  'ace-self-export': ACE_TEMPLATE,
  mixed: MIXED_TEMPLATE,
} as const

const PLACEHOLDER_RE = /\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g

/**
 * Render the outreach kit for a path against the supplied tokens.
 *
 * Throws on a missing required placeholder so we never email a
 * customer with `{{brokerName}}` literals embedded.
 */
export function renderOutreachKit(
  path: RecoveryPath,
  tokens: OutreachKitTokens,
): RenderedOutreachKit {
  const tpl = OUTREACH_KIT_TEMPLATES[path]
  for (const required of tpl.placeholders) {
    const value = tokens[required]
    if (value === undefined || value === null || value === '') {
      throw new Error(`renderOutreachKit: missing token: ${required} (path=${path})`)
    }
  }
  return {
    version: tpl.version,
    path,
    subject: substitute(tpl.subject, tokens),
    body: substitute(tpl.body, tokens),
  }
}

function substitute(text: string, tokens: OutreachKitTokens): string {
  const map = tokens as unknown as Record<string, string | undefined>
  return text.replace(PLACEHOLDER_RE, (_, name: string) => {
    const value = map[name]
    if (value === undefined) {
      throw new Error(`renderOutreachKit: undeclared token: ${name}`)
    }
    return value
  })
}

