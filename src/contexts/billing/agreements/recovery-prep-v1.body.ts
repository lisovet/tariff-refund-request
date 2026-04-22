import {
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
} from '@shared/disclosure/constants'

/**
 * Bundler-compatible body of the `recovery-prep-v1` clickwrap.
 *
 * Twin markdown source at `./recovery-prep-v1.md` is for legal
 * review and out-of-band diffs.
 */

export const RECOVERY_PREP_V1_BODY = `# Terms of Purchase — Recovery Kit + CAPE Prep

**Version:** recovery-prep-v1
**Effective Date:** {{EFFECTIVE_DATE_ISO}}
**Customer:** {{CUSTOMER_NAME}} ({{CUSTOMER_EMAIL}})
**Case reference:** {{CASE_ID}}
**Provider:** {{COMPANY_LEGAL_NAME}}

These are the lightweight terms for the Recovery Kit and CAPE Prep products, referenced in the Stripe receipt and in the purchase-confirmation email.

---

## 1. What you are purchasing

A software product and a document-prep service. We help you recover entry-number references and prepare a CBP-compatible Readiness Report. We do not submit anything to CBP on your behalf under these terms — **we prepare files; you control submission.**

## 2. Not legal advice

> ${NOT_LEGAL_ADVICE_DISCLOSURE}

> ${NOT_A_CUSTOMS_BROKER_CLAUSE}

## 3. Human review

Every Readiness Report is reviewed by a validator before it reaches you. We do not ship AI-only outputs.

## 4. Refund window

Recovery Kit and CAPE Prep purchases are refundable for fourteen (14) days from purchase if you have not downloaded the Readiness Report PDF. After download or after fourteen days, refunds are at our discretion.

## 5. Dispute resolution

Disputes are handled per our published support process. Material disputes escalate to binding arbitration in the state whose law governs this agreement.

## 6. Governing law

These terms are governed by the laws of {{GOVERNING_LAW_STATE}}.

---

_This version identifier (\`recovery-prep-v1\`) is recorded in your case audit log._
`
