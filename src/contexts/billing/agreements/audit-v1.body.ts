import {
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
} from '@shared/disclosure/constants'

/**
 * Bundler-compatible body of the `audit-v1` clickwrap — the
 * purchase terms for the $99 Audit tier.
 *
 * Twin markdown source at `./audit-v1.md` is for legal review and
 * out-of-band diffs. Keep both in sync when editing.
 *
 * The Audit is digital-delivery only (verdict, estimate, checklist,
 * templates). No human validator sign-off required on the deliverable
 * itself — the Audit tier's promise is a machine-computed eligibility
 * verdict and packet. Full Prep (which DOES require human sign-off)
 * is governed by `full-prep-v1`.
 */

export const AUDIT_V1_BODY = `# Terms of Purchase — Audit

**Version:** audit-v1
**Effective Date:** {{EFFECTIVE_DATE_ISO}}
**Customer:** {{CUSTOMER_NAME}} ({{CUSTOMER_EMAIL}})
**Case reference:** {{CASE_ID}}
**Provider:** {{COMPANY_LEGAL_NAME}}

These are the clickwrap purchase terms for the Audit tier, referenced in the Stripe receipt and in the purchase-confirmation email.

---

## 1. What you are purchasing

The Audit tier is a software-generated assessment plus a set of templates. It includes:

- A Phase 1 / Phase 2 eligibility verdict with a confidence level.
- A country-and-category analysis of which of your imports qualify.
- A tightened refund-range estimate based on your duty volume and import dates.
- A personalized checklist of exactly what to gather and in what order.
- A pre-written broker outreach email template, an ACE portal setup guide, and the CAPE CSV spec.

We do not review your documents, extract entry numbers, build or validate your CAPE CSV, or produce a pre-submission confidence report under these terms — that scope is covered by the Full Prep tier (\`full-prep-v1\`).

**We prepare files; you control submission.** Nothing in this tier involves us submitting anything to CBP on your behalf.

## 2. Not legal advice

> ${NOT_LEGAL_ADVICE_DISCLOSURE}

> ${NOT_A_CUSTOMS_BROKER_CLAUSE}

## 3. Delivery

The Audit packet is delivered digitally to the email and dashboard associated with your case. You retain access to the packet via your customer dashboard.

## 4. Refund window

Audit purchases are refundable for fourteen (14) days from purchase if you have not downloaded the Audit packet. After download or after fourteen days, refunds are at our discretion.

## 5. Upgrade credit

If you upgrade to Full Prep, the $99 Audit fee is credited in full against the Full Prep base fee — you do not pay for the same eligibility work twice.

## 6. Dispute resolution

Disputes are handled per our published support process. Material disputes escalate to binding arbitration in the state whose law governs this agreement.

## 7. Governing law

These terms are governed by the laws of {{GOVERNING_LAW_STATE}}.

---

_This version identifier (\`audit-v1\`) is recorded in your case audit log._
`
