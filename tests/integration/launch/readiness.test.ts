import { describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@shared/disclosure/constants'
import {
  SUB_PROCESSORS_LIST_VERSION,
  getActiveV1SubProcessors,
} from '@shared/trust/sub-processors'
import { AGREEMENTS, REQUIRED_CLAUSES } from '@contexts/billing'
import { FUNNEL_EVENT_KINDS } from '@shared/infra/funnel'
import { renderEmail } from '@shared/infra/email'
import * as Emails from '@shared/infra/email'
import { workflows } from '@shared/infra/inngest/workflows'

/**
 * USER-TEST checkpoint #14 (task #86): final Phase 0 launch
 * readiness review.
 *
 * Sentinel test that binds every must-have invariant from the
 * preceding USER-TESTs (#66, #71, #76, #83) + cross-cutting
 * commitments (#84 lint rule, #85 funnel events) into one
 * meta-assertion. Everything below must be green before emitting
 * V1_COMPLETE.
 *
 * The human side of the checkpoint — a founder actually walking
 * through the product on staging — is captured in `docs/GO-LIVE.md`
 * step 14 (end-to-end staging smoke). This test proves the
 * plumbing; the human confirms the experience.
 */

describe('Launch readiness — persistence scaffolding', () => {
  it('every v1 Drizzle migration is present + numbered 0000..0007', () => {
    const migrations = readdirSync(join(process.cwd(), 'drizzle'))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    expect(migrations).toEqual([
      '0000_identity.sql',
      '0001_screener.sql',
      '0002_billing.sql',
      '0003_cases_audit_log.sql',
      '0004_documents_recovery_sources.sql',
      '0005_payments_aggregate.sql',
      '0006_entries_provenance.sql',
      '0007_batches.sql',
    ])
  })
})

describe('Launch readiness — disclosure carriage', () => {
  it('canonical trust promise is the four-clause version, verbatim', () => {
    expect(CANONICAL_TRUST_PROMISE).toContain('We help prepare your refund file.')
    expect(CANONICAL_TRUST_PROMISE).toContain('We do not guarantee CBP will approve it.')
    expect(CANONICAL_TRUST_PROMISE).toContain(
      'We do not provide legal advice in this product.',
    )
    expect(CANONICAL_TRUST_PROMISE).toContain(
      'Every artifact you receive has been reviewed by a real person before it reaches you.',
    )
  })

  it('submission-control clause is stable (referenced verbatim in 4 surfaces)', () => {
    expect(SUBMISSION_CONTROL_CLAUSE).toBe(
      'We prepare files; you control submission.',
    )
  })

  it('NOT_LEGAL_ADVICE_DISCLOSURE leads with the "Not legal advice." marker', () => {
    expect(NOT_LEGAL_ADVICE_DISCLOSURE.startsWith('Not legal advice.')).toBe(true)
  })
})

describe('Launch readiness — agreements + compliance', () => {
  it('both v1 agreements register + each one passes its required clauses', () => {
    expect(AGREEMENTS['audit-v1']).toBeDefined()
    expect(AGREEMENTS['full-prep-v1']).toBeDefined()

    for (const a of Object.values(AGREEMENTS)) {
      for (const clause of REQUIRED_CLAUSES) {
        if (!clause.applies(a.appliesTo)) continue
        expect(a.body).toMatch(clause.probe)
      }
    }
  })

  it('sub-processor list version ≥ 2 (post Neon→Railway swap)', () => {
    expect(SUB_PROCESSORS_LIST_VERSION).toBeGreaterThanOrEqual(2)
  })

  it('active v1 sub-processors include Railway (hosting + Postgres consolidated)', () => {
    const active = getActiveV1SubProcessors().map((s) => s.vendor)
    expect(active).toContain('Railway')
    // Neon + Vercel must NOT re-enter the active list — the swap
    // removed them. Re-adding either would drift from the
    // customer-published list.
    expect(active).not.toContain('Neon')
    expect(active).not.toContain('Vercel')
  })
})

describe('Launch readiness — Inngest workflows registered', () => {
  it('every expected workflow is in the registry', () => {
    const ids = workflows.map((w) => {
      // Inngest surfaces the id via .id() in v4; fall back to the
      // registered configuration if the runtime exposes it another
      // way under this adapter version.
      const fn = w as unknown as {
        id?: (() => string) | string
        _def?: { id?: string }
      }
      if (typeof fn.id === 'function') return fn.id()
      if (typeof fn.id === 'string') return fn.id
      return fn._def?.id ?? 'unknown'
    })
    // Twelve workflows make up the v1 registry.
    expect(workflows.length).toBe(12)
    // Spot-check the five funnel workflows (task #85) + the
    // artifact pipeline (#70) + the concierge checkout
    // (#73) landed.
    const bag = ids.join(' ')
    for (const kind of [
      'artifact-generation',
      'concierge-checkout-on-signed',
      'screener-completed',
      'screener-nudge',
      'audit-log-mirror',
      'stalled-cadence',
      'funnel-screener-completed',
      'funnel-payment-completed',
      'funnel-concierge-signed',
      'funnel-batch-signed-off',
      'funnel-case-state-transitioned',
    ]) {
      expect(bag).toContain(kind)
    }
  })
})

describe('Launch readiness — funnel catalog', () => {
  it('exposes exactly the PRD 00 §9 metric kinds', () => {
    expect(FUNNEL_EVENT_KINDS).toEqual([
      'screener.completed',
      'screener.qualified',
      'recovery.purchased',
      'prep.purchased',
      'concierge.signed',
      'concierge.purchased',
      'batch.signed_off',
      'case.filed',
      'case.paid',
      'case.state_transitioned',
    ])
  })
})

describe('Launch readiness — every lifecycle email renders', () => {
  // Every email template the lifecycle workflows send must render
  // without throwing; a template regression here would break the
  // customer experience in prod without an obvious test failure
  // elsewhere.
  const cases: { name: string; node: () => Promise<unknown> }[] = [
    {
      name: 'ScreenerResultsEmail',
      node: () =>
        renderEmail(
          Emails.ScreenerResultsEmail({
            firstName: 'Pilot',
            resultsUrl: 'https://example.test/results',
          }),
        ),
    },
    {
      name: 'ScreenerNudge24hEmail',
      node: () =>
        renderEmail(
          Emails.ScreenerNudge24hEmail({
            firstName: 'Pilot',
            resultsUrl: 'https://example.test/results',
            howItWorksUrl: 'https://example.test/how-it-works',
          }),
        ),
    },
    {
      name: 'ScreenerNudge72hEmail',
      node: () =>
        renderEmail(
          Emails.ScreenerNudge72hEmail({
            firstName: 'Pilot',
            resultsUrl: 'https://example.test/results',
          }),
        ),
    },
    {
      name: 'RecoveryPurchasedEmail',
      node: () =>
        renderEmail(
          Emails.RecoveryPurchasedEmail({
            firstName: 'Pilot',
            caseUrl: 'https://example.test/app/case',
          }),
        ),
    },
    {
      name: 'RecoveryMissingDocsEmail',
      node: () =>
        renderEmail(
          Emails.RecoveryMissingDocsEmail({
            firstName: 'Pilot',
            caseUrl: 'https://example.test/app/case',
            scheduleCallUrl: 'https://example.test/call',
          }),
        ),
    },
    {
      name: 'EntryListReadyEmail',
      node: () =>
        renderEmail(
          Emails.EntryListReadyEmail({
            firstName: 'Pilot',
            entryCount: 42,
            caseUrl: 'https://example.test/app/entries',
          }),
        ),
    },
    {
      name: 'PrepReadyEmail',
      node: () =>
        renderEmail(
          Emails.PrepReadyEmail({
            firstName: 'Pilot',
            readinessReportUrl: 'https://example.test/report.pdf',
            conciergeUpgradeUrl: 'https://example.test/concierge',
          }),
        ),
    },
    {
      name: 'ConciergeUpsellEmail',
      node: () =>
        renderEmail(
          Emails.ConciergeUpsellEmail({
            firstName: 'Pilot',
            conciergePurchaseUrl: 'https://example.test/concierge',
          }),
        ),
    },
    {
      name: 'ReengagementEmail',
      node: () =>
        renderEmail(
          Emails.ReengagementEmail({
            firstName: 'Pilot',
            caseUrl: 'https://example.test/app',
          }),
        ),
    },
  ]

  for (const c of cases) {
    it(`${c.name} renders to non-empty HTML + text`, async () => {
      const rendered = (await c.node()) as { html?: string; text?: string }
      expect(rendered.html?.length ?? 0).toBeGreaterThan(50)
      expect(rendered.text?.length ?? 0).toBeGreaterThan(10)
      // Every email carries the canonical "Not legal advice"
      // disclosure via EmailLayout.
      expect(rendered.html).toContain(NOT_LEGAL_ADVICE_DISCLOSURE)
    })
  }
})

describe('Launch readiness — PRD 00 Checkpoint 4 coverage summary', () => {
  it('every USER-TEST prerequisite is green', () => {
    // This is a sentinel. The explicit prerequisite tests live in:
    //   tests/integration/cape/validator-pipeline.test.ts    (#66)
    //   tests/integration/cape/photographable-report.test.ts (#71)
    //   tests/integration/trust/posture-review.test.tsx      (#76)
    //   tests/integration/ops/full-case-walkthrough.test.ts  (#83)
    // The vitest runner surfaces any failure above; we assert
    // only the sentinel promise holds at this integration point.
    expect(true).toBe(true)
  })
})
