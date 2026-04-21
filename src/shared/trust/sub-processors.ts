/**
 * Sub-processor list — single source of truth per PRD 10 §Sub-processors.
 *
 * This module feeds:
 *   - /trust — summary table.
 *   - /trust/sub-processors — full tabular render.
 *   - Phase-1 lifecycle notification workflow (announces updates to
 *     active customers within 14 days of a change).
 *
 * Rules when editing:
 *   - Adding a vendor or materially changing a vendor's purpose
 *     requires bumping `SUB_PROCESSORS_LIST_VERSION` by one.
 *   - Version bumps are a BINDING commitment to send the lifecycle
 *     notification — do not bump the version without the content
 *     change that earns it.
 *   - Never remove a vendor silently; if a vendor is sunset,
 *     comment its entry out AND bump the version.
 */

export const SUB_PROCESSOR_PHASES = ['v1', 'Phase 2'] as const
export type SubProcessorPhase = (typeof SUB_PROCESSOR_PHASES)[number]

export const SUB_PROCESSOR_CATEGORIES = [
  'infrastructure',
  'auth_payments',
  'workflow_comms',
  'observability',
  'ai_ocr',
] as const
export type SubProcessorCategory = (typeof SUB_PROCESSOR_CATEGORIES)[number]

export interface SubProcessor {
  readonly vendor: string
  readonly purpose: string
  readonly region: string
  readonly phase: SubProcessorPhase
  readonly category: SubProcessorCategory
}

/**
 * Bump this integer whenever the list content changes. Phase-1
 * lifecycle workflow keys notification idempotency on this value.
 */
export const SUB_PROCESSORS_LIST_VERSION = 1

export const SUB_PROCESSORS: readonly SubProcessor[] = [
  // Infrastructure
  {
    vendor: 'Vercel',
    purpose: 'Application hosting + edge runtime.',
    region: 'Global edge',
    phase: 'v1',
    category: 'infrastructure',
  },
  {
    vendor: 'Neon',
    purpose: 'Postgres database (case + entry + audit data).',
    region: 'US-East (primary)',
    phase: 'v1',
    category: 'infrastructure',
  },
  {
    vendor: 'Cloudflare R2',
    purpose: 'Document storage (uploaded source records + artifacts).',
    region: 'Global, primary US',
    phase: 'v1',
    category: 'infrastructure',
  },
  // Auth + payments
  {
    vendor: 'Clerk',
    purpose: 'Authentication + organization / role management.',
    region: 'US',
    phase: 'v1',
    category: 'auth_payments',
  },
  {
    vendor: 'Stripe',
    purpose: 'Payments + invoicing for the success-fee model.',
    region: 'US',
    phase: 'v1',
    category: 'auth_payments',
  },
  // Workflow + comms
  {
    vendor: 'Inngest',
    purpose: 'Durable workflow execution (lifecycle email, reminders).',
    region: 'US',
    phase: 'v1',
    category: 'workflow_comms',
  },
  {
    vendor: 'Resend',
    purpose: 'Transactional + lifecycle email delivery.',
    region: 'US',
    phase: 'v1',
    category: 'workflow_comms',
  },
  // Observability
  {
    vendor: 'Sentry',
    purpose: 'Error tracking + performance monitoring.',
    region: 'US',
    phase: 'v1',
    category: 'observability',
  },
  {
    vendor: 'Axiom',
    purpose: 'Structured logs + audit-log mirror.',
    region: 'US',
    phase: 'v1',
    category: 'observability',
  },
  // Phase 2 — explicitly flagged
  {
    vendor: 'AWS Textract / Google Document AI',
    purpose:
      'OCR for 7501s and carrier invoices. Active only when Phase-2 OCR is enabled.',
    region: 'US',
    phase: 'Phase 2',
    category: 'ai_ocr',
  },
  {
    vendor: 'Anthropic',
    purpose:
      'LLM-assisted document extraction + Readiness Report drafting. Active only when Phase-2 AI assist is enabled.',
    region: 'US',
    phase: 'Phase 2',
    category: 'ai_ocr',
  },
] as const

export function getActiveV1SubProcessors(): readonly SubProcessor[] {
  return SUB_PROCESSORS.filter((s) => s.phase === 'v1')
}

export function getSubProcessorsByCategory(
  category: SubProcessorCategory,
): readonly SubProcessor[] {
  return SUB_PROCESSORS.filter((s) => s.category === category)
}
