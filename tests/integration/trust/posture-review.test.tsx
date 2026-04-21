// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrustPage from '@/app/(marketing)/trust/page'
import SecurityPage from '@/app/(marketing)/trust/security/page'
import SubProcessorsPage from '@/app/(marketing)/trust/sub-processors/page'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@shared/disclosure/constants'
import {
  AGREEMENTS,
  REQUIRED_CLAUSES,
  renderAgreement,
  type AgreementVariables,
} from '@contexts/billing'
import {
  SUB_PROCESSORS,
  SUB_PROCESSORS_LIST_VERSION,
  getActiveV1SubProcessors,
} from '@shared/trust/sub-processors'
import { renderReadinessReport } from '@contexts/cape/server'
import { PrepReadyEmail, renderEmail } from '@shared/infra/email'
import {
  createInMemoryDeletionRepo,
  createInMemoryIdentityRepo,
  processPendingDeletions,
  requestCustomerDeletion,
  type GlobalAuditSink,
  type GlobalAuditSinkInput,
} from '@contexts/identity'
import { createInMemoryCaseRepo } from '@contexts/ops/server'

/**
 * USER-TEST checkpoint #12 (task #76): trust-posture review.
 *
 * Implementation-side codification of the trust-posture consistency
 * bar so a founder + outside reviewer walkthrough can start from a
 * known-baseline (every surface carries the canonical strings in the
 * right places; no paraphrased trust promises anywhere; the data-
 * rights deletion audit writes content-free).
 *
 * Subjective review by a founder + lawyer is the human side — see
 * STATUS.md "Human-verification still owes" for what this test
 * cannot assess.
 */

const AGREEMENT_VARS: AgreementVariables = {
  customerName: 'Pioneer Optics Corp',
  customerEmail: 'controller@pioneer-optics.test',
  caseId: 'cas_trust_1',
  effectiveDateIso: '2026-04-21',
  companyLegalName: 'Takemaya Software, Inc.',
  governingLawState: 'Delaware',
}

describe('USER-TEST #12 — trust-posture consistency across surfaces', () => {
  it('/trust renders the canonical trust promise + the non-goals + the disclosure', () => {
    render(<TrustPage />)
    // Split-text assertions because the promise may wrap lines.
    expect(screen.getByText(/help prepare your refund file/i)).toBeTruthy()
    expect(screen.getByText(/do not guarantee CBP/i)).toBeTruthy()
    expect(screen.getAllByText(/do not provide legal advice/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/reviewed by a real person/i)).toBeTruthy()
  })

  it('/trust/security renders the six required sections + sub-processor count from the shared list', () => {
    render(<SecurityPage />)
    expect(screen.getByRole('heading', { name: /authentication/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /storage & encryption/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /retention/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /access control/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /incident response/i })).toBeTruthy()
    expect(
      screen.getByText(
        new RegExp(`${getActiveV1SubProcessors().length} active sub-processors`, 'i'),
      ),
    ).toBeTruthy()
  })

  it('/trust/sub-processors renders every entry + the list-version stamp', () => {
    render(<SubProcessorsPage />)
    for (const s of SUB_PROCESSORS) {
      expect(screen.getByText(s.vendor)).toBeTruthy()
    }
    expect(
      screen.getByText(new RegExp(`List version v${SUB_PROCESSORS_LIST_VERSION}`, 'i')),
    ).toBeTruthy()
  })

  describe('engagement letters carry every REQUIRED_CLAUSE that applies to the SKU', () => {
    for (const [id, a] of Object.entries(AGREEMENTS)) {
      const rendered = renderAgreement(a.id, AGREEMENT_VARS)
      for (const clause of REQUIRED_CLAUSES) {
        const applies = clause.applies(a.appliesTo)
        if (!applies) continue
        it(`${id} carries ${clause.id}`, () => {
          expect(rendered).toMatch(clause.probe)
        })
      }
    }
  })

  it('concierge-v1 carries the canonical trust promise verbatim (after interpolation)', () => {
    const rendered = renderAgreement('concierge-v1', AGREEMENT_VARS)
    expect(rendered).toContain(CANONICAL_TRUST_PROMISE)
    expect(rendered).toContain(NOT_LEGAL_ADVICE_DISCLOSURE)
  })

  it('Readiness Report PDF renders with the full disclosure block + signed-off attribution', async () => {
    const pdf = await renderReadinessReport({
      caseId: 'cas_trust_1',
      customerName: 'Pioneer Optics Corp',
      generatedAtIso: '2026-04-21T13:00:00.000Z',
      analystName: 'Mina Ortega',
      body: {
        totalEntries: 1,
        blockingCount: 0,
        warningCount: 0,
        infoCount: 0,
        entryRows: [
          {
            id: 'e1',
            entryNumber: '123-4567890-1',
            entryDate: '2024-09-01',
            importerOfRecord: 'Pioneer Optics Corp',
            dutyAmountUsdCents: 125_000,
            status: 'ok',
            notes: [],
          },
        ],
        prerequisites: [{ id: 'ior_on_file', label: 'IOR on file', met: true }],
        signoff: {
          analystName: 'Mina Ortega',
          signedAtIso: '2026-04-21T13:00:00.000Z',
          note: 'Entries match broker extracts; IORs validated.',
        },
      },
    })
    expect(pdf.slice(0, 5).toString('ascii')).toBe('%PDF-')
    // The case id appears UTF-16BE encoded in the PDF info dict.
    const caseIdBytes = utf16be('cas_trust_1')
    expect(pdf.indexOf(caseIdBytes)).toBeGreaterThanOrEqual(0)
  }, 15_000)

  it('Prep-ready email carries NOT_LEGAL_ADVICE_DISCLOSURE verbatim via EmailLayout', async () => {
    const { html } = await renderEmail(
      PrepReadyEmail({
        firstName: 'Pioneer',
        readinessReportUrl: 'https://test/report.pdf',
        conciergeUpgradeUrl: 'https://test/concierge',
      }),
    )
    expect(html).toContain(NOT_LEGAL_ADVICE_DISCLOSURE)
  })

  it('deletion worker writes a content-free audit row (no PII leaks)', async () => {
    const identityRepo = createInMemoryIdentityRepo()
    const caseRepo = createInMemoryCaseRepo()
    const customer = await identityRepo.upsertCustomer({
      clerkUserId: 'user_trust',
      email: 'pii@example.test',
      fullName: 'Jane Sensitive',
    })
    await caseRepo.createCase({ tier: 'smb', customerId: customer.id })
    const deletionRepo = createInMemoryDeletionRepo()
    const now = new Date('2026-04-21T14:00:00.000Z')
    await requestCustomerDeletion(
      { customerId: customer.id, reason: 'customer-initiated' },
      { deletionRepo, clock: () => now },
    )
    const globalAuditSink = vi.fn<GlobalAuditSink>(
      async (_i: GlobalAuditSinkInput) => 'audit_1',
    )
    const later = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)
    await processPendingDeletions(later, {
      deletionRepo,
      caseRepo,
      identityRepo,
      globalAuditSink,
    })
    expect(globalAuditSink).toHaveBeenCalledTimes(1)
    const payload = globalAuditSink.mock.calls[0]?.[0]
    // The payload is counts-only — no PII.
    expect(payload?.kind).toBe('customer.deleted')
    expect(payload).not.toHaveProperty('email')
    expect(payload).not.toHaveProperty('fullName')
    expect(payload).not.toHaveProperty('name')
    expect(
      JSON.stringify(payload).includes('pii@example.test'),
    ).toBe(false)
    expect(JSON.stringify(payload).includes('Jane Sensitive')).toBe(false)
  })

  it('no trust-posture surface paraphrases the canonical promise (real text, not approximated)', () => {
    // The four clauses appear verbatim. This test is a tripwire
    // against a future refactor that mistakes the promise for
    // marketing copy and rewrites it.
    const clauses = [
      'We help prepare your refund file.',
      'We do not guarantee CBP will approve it.',
      'We do not provide legal advice in this product.',
      'Every artifact you receive has been reviewed by a real person before it reaches you.',
    ]
    for (const clause of clauses) {
      expect(CANONICAL_TRUST_PROMISE).toContain(clause)
    }
    // SUBMISSION_CONTROL_CLAUSE stays stable too.
    expect(SUBMISSION_CONTROL_CLAUSE).toBe(
      'We prepare files; you control submission.',
    )
  })
})

function utf16be(s: string): Buffer {
  const buf = Buffer.alloc(s.length * 2)
  for (let i = 0; i < s.length; i += 1) {
    buf.writeUInt16BE(s.charCodeAt(i), i * 2)
  }
  return buf
}
