# ADR 006 — Cloudflare R2 for document storage

**Status:** Accepted

## Context

The product is document-heavy: customers upload 7501s, broker spreadsheets, carrier invoices, and ACE exports. Documents must be (1) immutable once uploaded (compliance), (2) cheap to store at scale, (3) cheap to read back during ops review and AI/OCR processing in Phase 2. Egress cost is a real concern given OCR will repeatedly read the same documents.

## Decision

**Cloudflare R2** as the object store.

- S3-compatible API → use the AWS SDK, no vendor-specific code.
- Zero egress fees → critical when OCR pipelines re-read documents.
- One bucket per environment (`tariff-refund-{dev,staging,prod}`).
- Document keys: `cases/{caseId}/{documentId}/{filename}` — case-scoped for cheap deletion if a customer revokes.
- Versioning enabled; we never overwrite a document.

## Consequences

- ✅ Storage cost predictable and low.
- ✅ Standard S3 SDK — escape-hatch to AWS S3 if R2 ever fails us.
- ⚠️ R2's eventual-consistency guarantees are weaker than S3 in some edge cases — reads after write can lag briefly. Not a problem for our workflows.
- ⚠️ Pre-signed upload URLs require careful expiry — 15 minutes max.

## Test-impact

- Use `@aws-sdk/client-s3` against a local MinIO container in CI.
- Never mock the storage client — all tests go through MinIO.
