import {
  CANONICAL_TRUST_PROMISE,
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
} from '@shared/disclosure/constants'

/**
 * Bundler-compatible body of the `full-prep-v1` engagement letter —
 * the e-signed agreement governing the Full Prep tier ($999 base +
 * 10 % of estimated refund, capped at $25,000).
 *
 * Twin markdown source at `./full-prep-v1.md` is for legal review
 * and out-of-band diffs. Keep both in sync when editing. Tests in
 * `./__tests__/registry.test.ts` freeze the required clauses so the
 * two files drifting apart in content fails CI.
 *
 * This is the tier that carries the canonical trust promise verbatim
 * per PRD 10 + `.claude/rules/disclosure-language-required.md`.
 */

export const FULL_PREP_V1_BODY = `# Full Prep Engagement Letter

**Version:** full-prep-v1
**Effective Date:** {{EFFECTIVE_DATE_ISO}}
**Customer:** {{CUSTOMER_NAME}}
**Customer contact:** {{CUSTOMER_EMAIL}}
**Case reference:** {{CASE_ID}}
**Provider:** {{COMPANY_LEGAL_NAME}} ("we," "us," "our")

This letter sets out the terms under which {{COMPANY_LEGAL_NAME}} will provide the Full Prep service to {{CUSTOMER_NAME}} ("you," "your"). By countersigning, both parties agree to the terms below.

---

## 1. Scope of engagement

We will prepare one CAPE submission file on your behalf, end-to-end. Scope is bounded to:

- Recovery of entry-number references from carrier / broker / ACE sources you nominate, including direct follow-up with your broker or carrier until we have what we need.
- Canonical entry normalization, provenance capture, and a country-and-category analysis that separates Phase 1 from Phase 2 eligibility.
- Preparation of a CBP-compatible CAPE CSV — formatted, validated, and split into batches if required.
- A pre-submission confidence report: a plain-English summary of what's in the file, any flags that could cause a CBP hold, and the expected timeline.
- An ACE upload walkthrough so nothing goes wrong at submission.

## 2. What we do not do

We prepare files; you control submission. We do not operate as your licensed customs brokerage unless a separate, specifically-identified engagement explicitly names us in that capacity. Nothing in this letter makes us your legal counsel. This product is not legal advice. Refund timing depends on CBP review and is outside our control.

> ${NOT_LEGAL_ADVICE_DISCLOSURE}

> ${NOT_A_CUSTOMS_BROKER_CLAUSE}

## 3. Our trust posture (binding)

> ${CANONICAL_TRUST_PROMISE}

This is the canonical trust promise and it applies to every artifact we deliver to you under this engagement.

## 4. Deliverables

1. A validated, submission-ready CAPE CSV in the filing format appropriate to your entries.
2. A signed Readiness Report PDF — reviewed by a validator named on the report.
3. A pre-submission confidence report — plain-English summary, flags, expected timeline.
4. Coordination notes — a running log of broker / carrier / ACE interactions we performed on your behalf.
5. Phase 2 follow-up: if your entries span both windows, we hold your Phase 2 file and re-engage when that window opens.

Each deliverable records this agreement's version stamp so the artifact is traceable back to the exact terms you accepted.

## 5. Fees

Full Prep is priced as a **$999 base engagement fee due at signature** plus a **success fee of 10 % of the estimated refund, capped at $25,000**, billed after the file is delivered.

- The base fee is captured via Stripe Checkout on signature.
- The success fee is billed after file delivery against the estimated refund we ground in your Audit; it is the legal basis for our compensation on the Full Prep workflow.
- A refund denial or partial refund from CBP does not retroactively reduce the success fee that was billed on the estimated refund at delivery time — the fee is priced on the work product, not the CBP outcome.
- Nothing in this engagement replaces or overrides the published pricing schedule at the time of purchase.

## 6. Turnaround

We target five (5) business days from the date we have received all required documents to file delivery. If we cannot meet that target for case-specific reasons, we will disclose the delay in writing rather than lower the review bar.

## 7. Human review is non-negotiable

No artifact is delivered to you unless a human validator has reviewed and signed off. We do not ship AI-only outputs under this engagement. If we cannot staff a validator to your timeline, we will disclose the delay in writing rather than lower the review bar.

## 8. Confidentiality & data handling

- Documents you upload are retained under the retention schedule published at \`/trust\`.
- We do not sell, share, or use your data to train third-party models outside the scope of this engagement.
- Sub-processors appear on the live \`/trust/sub-processors\` page; material additions are disclosed before they take effect.
- You may request deletion at any time; our written deletion-confirmation policy applies.

## 9. Dispute resolution

If either party disputes any aspect of performance or fees, the parties agree first to attempt good-faith resolution within thirty (30) days of written notice. If unresolved, the dispute will be resolved by binding arbitration administered under the rules of the American Arbitration Association, with the seat of arbitration in a location mutually agreed by the parties or — absent agreement — in the state whose law governs this agreement.

Nothing in this dispute clause limits either party's right to seek injunctive relief for misappropriation of intellectual property or unauthorized disclosure of confidential information.

## 10. Governing law

This agreement is governed by the laws of {{GOVERNING_LAW_STATE}}, without regard to conflict-of-laws principles.

## 11. Termination

Either party may terminate this engagement on ten (10) days' written notice. On termination:

- Fees earned through the date of termination remain payable.
- A contingent success fee survives if CBP later posts a refund on entries we materially prepared.
- Documents are returned or deleted per your written instruction within thirty (30) days.

## 12. Entire agreement

This engagement, together with the published pricing schedule in effect on the effective date and the trust posture at \`/trust\`, is the entire agreement between the parties concerning Full Prep services. It supersedes prior discussions.

---

_Signed electronically by both parties. The signed copy records this version identifier (\`full-prep-v1\`) so the deliverables can be traced to the exact terms you accepted._
`
