# Disclosure language is product, not marketing

The trust posture promises (PRD 10) are part of the product UX, not a separate marketing concern. They appear on every relevant surface as real text — never images, never collapsed behind "Read more" by default.

## Required surfaces

- **"Not legal advice"** — footer of every page; Readiness Report PDF footnotes; engagement letters.
- **"We prepare files; you control submission."** — `/how-it-works`, `/cape-prep`, `/trust`, Readiness Report.
- **"Refund timing depends on CBP review."** — `/concierge`, the `pending_cbp` state screen.
- **"Estimates are based on the information you provided."** — screener results page.
- **Reviewing-analyst attribution** — Readiness Report and submission-ready state always names the validator and timestamp.

## Forbidden patterns

- Images that depict text instead of using real text (breaks accessibility + indexability).
- Collapsed accordions hiding required disclosures by default.
- Removing the "Not legal advice" footnote from any customer-facing page.
- Replacing the canonical trust promise with a paraphrase in any artifact.

## Canonical trust promise (verbatim)

> We help prepare your refund file. We do not guarantee CBP will approve it. We do not provide legal advice in this product. Every artifact you receive has been reviewed by a real person before it reaches you.

This sentence appears verbatim on the homepage trust section, the Concierge engagement letter, and the Readiness Report PDF.

## Why this matters

Trust is the product. Inconsistency in disclosure language signals operational sloppiness — exactly the impression a refund-prep service must not give. Real-text disclosures are also load-bearing for accessibility, SEO, and legal review.

## How to apply

- New customer-facing pages get the trust footnote pattern via the shared Footer component (do not create a one-off footer).
- Any new artifact (PDF, email, downloadable file) that customers receive must include the canonical promise + the relevant scope-specific disclosure.
- Edits to the canonical promise require explicit approval — it is intentionally repeated verbatim across surfaces.
