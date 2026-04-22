import type { CaseState } from './case-machine'

/**
 * Per-state copy shared across the customer dashboard (/app) and the
 * ops case workspace (/ops). One source of truth so the two surfaces
 * never drift.
 *
 * Each state carries:
 *   - `customerLabel`  — short, friendly title for the customer
 *     dashboard ("Recovery in progress", "Refund posted").
 *   - `customerDescription` — a plain-language sentence telling the
 *     customer what this state means for them and, when applicable,
 *     what happens next.
 *   - `opsLabel` — the staff-facing label. Rendered in the ops
 *     console; CSS handles the uppercase treatment.
 *
 * Customer and ops labels are intentionally DIFFERENT per state —
 * customer copy is softer ("Not a fit right now"), ops copy is blunt
 * ("Disqualified") — but they are co-located here so any update lands
 * on both surfaces at once.
 */
export interface StateCopy {
  readonly customerLabel: string
  readonly customerDescription: string
  readonly opsLabel: string
}

export const STATE_COPY: Record<CaseState, StateCopy> = {
  new_lead: {
    customerLabel: 'Getting started',
    customerDescription:
      "We've received your screener — next step is to purchase Recovery so we can rebuild your entry list.",
    opsLabel: 'New lead',
  },
  qualified: {
    customerLabel: 'Eligible',
    customerDescription:
      'Your answers qualify. Purchase Recovery to open the case.',
    opsLabel: 'Qualified',
  },
  disqualified: {
    customerLabel: 'Not a fit right now',
    customerDescription:
      "Based on your answers, you don't appear to qualify for an IEEPA refund right now. We'll reach out if that changes.",
    opsLabel: 'Disqualified',
  },
  awaiting_purchase: {
    customerLabel: 'Awaiting purchase',
    customerDescription: 'Complete the Recovery purchase to move forward.',
    opsLabel: 'Awaiting purchase',
  },
  awaiting_docs: {
    customerLabel: 'Awaiting documents',
    customerDescription:
      'Upload what you have — 7501s, broker spreadsheets, carrier invoices, or ACE CSVs.',
    opsLabel: 'Awaiting docs',
  },
  entry_recovery_in_progress: {
    customerLabel: 'Recovery in progress',
    customerDescription:
      "We're reconciling your entries across broker, carrier, and ACE sources.",
    opsLabel: 'Recovery in progress',
  },
  entry_list_ready: {
    customerLabel: 'Entry list ready',
    customerDescription:
      'Review the recovered entry list. Next: purchase Filing prep.',
    opsLabel: 'Entry list ready',
  },
  awaiting_prep_purchase: {
    customerLabel: 'Awaiting Filing prep purchase',
    customerDescription:
      'Purchase Filing prep to move from entry list to submission-ready file.',
    opsLabel: 'Awaiting prep purchase',
  },
  cape_prep_in_progress: {
    customerLabel: 'Filing prep in progress',
    customerDescription:
      "We're running your entries through the CAPE validator and drafting the Readiness Report.",
    opsLabel: 'CAPE prep in progress',
  },
  batch_qa: {
    customerLabel: 'Human review',
    customerDescription: 'A validator is reviewing your batch before it ships.',
    opsLabel: 'Batch QA',
  },
  submission_ready: {
    customerLabel: 'Submission ready',
    customerDescription:
      'Your CSV + Readiness Report are available. You or your broker submit to CBP.',
    opsLabel: 'Submission ready',
  },
  concierge_active: {
    customerLabel: 'Concierge active',
    customerDescription:
      "We're coordinating the filing with you or your broker.",
    opsLabel: 'Concierge active',
  },
  filed: {
    customerLabel: 'Filed',
    customerDescription: 'Your claim was filed. Monitoring CBP status.',
    opsLabel: 'Filed',
  },
  pending_cbp: {
    customerLabel: 'Pending CBP',
    customerDescription:
      'CBP is reviewing. Refund timing depends on their review.',
    opsLabel: 'Pending CBP',
  },
  deficient: {
    customerLabel: 'Needs remediation',
    customerDescription: 'CBP flagged an issue. Coordinator is on it.',
    opsLabel: 'Deficient',
  },
  paid: {
    customerLabel: 'Refund posted',
    customerDescription:
      'Your refund has been posted to the account on file.',
    opsLabel: 'Paid',
  },
  stalled: {
    customerLabel: 'Stalled',
    customerDescription:
      'Waiting on your response — check your email for next steps.',
    opsLabel: 'Stalled',
  },
  closed: {
    customerLabel: 'Closed',
    customerDescription: 'Case closed. No action needed.',
    opsLabel: 'Closed',
  },
}
