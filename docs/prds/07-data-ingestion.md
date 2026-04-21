# PRD 07 — Data Ingestion & Normalization

## Purpose

Get usable entry data into our system from sources that range from "clean ACE export" to "screenshots of broker emails." Ingestion is the seam between the customer's chaos and our domain model — its job is to assign provenance, normalize formats, and surface confidence so that downstream prep can trust what it sees.

## Source hierarchy (most to least useful)

| Source | Usefulness | Notes |
| --- | --- | --- |
| ACE CSV export | Highest | Authoritative, machine-clean |
| CBP Form 7501 / entry summary | High | PDF; v1 manual extraction, v2 OCR |
| Broker spreadsheet | High | Format varies; we normalize |
| Broker emails with attachments | Medium-high | `.eml` parser surfaces attachments |
| DHL/FedEx/UPS duty invoices | Medium | Carrier-specific layouts |
| Internal AP / ERP duty reports | Medium-low | Often miss entry numbers |
| Commercial invoices | Low (direct) | Useful for context only |

## Recovery routing model (cross-references PRD 02 + ADR 015)

| Path | User type | Workflow |
| --- | --- | --- |
| Broker | Used third-party broker | Broker outreach kit, accept 7501s + spreadsheets |
| Carrier | Used DHL/FedEx/UPS for clearance | Carrier-specific instructions, accept invoices |
| ACE self-export | Has ACE access | Export walkthrough, accept ACE CSVs |
| Mixed | Combination | Multi-path workspace |

## Normalization rules

Applied on ingest by `src/contexts/entries/normalize.ts`:

- **Entry-number canonicalization** — strip whitespace, normalize separators, validate against CBP format.
- **Duplicate detection** — exact match on canonicalized entry number; fuzzy match on entry-date + IOR for near-dupes (flagged for human review).
- **Date-window validation** — every entry tagged in/out of IEEPA window with explicit window version pinned.
- **Phase segmentation** — entries assigned to phase based on entry-date thresholds.
- **Batch grouping** — heuristic recommendation based on phase and CBP-recommended batch size.
- **Source-confidence tracking** — every entry inherits the confidence of its source path; manual re-keys lower the confidence; analyst verification raises it.

## Domain entities (additions)

```ts
RecoverySource = {
  id, caseId, path: RecoveryPath, kind: DocType
  uploadKey: StorageKey
  uploadedAt, uploadedBy
  parseStatus: 'pending' | 'parsed' | 'rejected' | 'manual'
  confidence: ConfidenceScore
}

EntrySourceRecord = {
  id, entryId, recoverySourceId
  rawData jsonb       // original extracted payload
  extractedAt, extractedBy
}

ConfidenceScore = {
  level: 'high' | 'medium' | 'low'
  signals: { pathConfidence, manualVerification, crossSourceConsistency }
  notes?: string
}
```

Every `EntryRecord` carries at least one `EntrySourceRecord`. Multiple sources strengthen confidence.

## Acceptance criteria

- **Given** a customer uploads an ACE CSV with 100 entries,
  **When** ingestion completes,
  **Then** 100 `EntryRecord`s exist with `confidence.level = 'high'` and the source path tagged.
- **Given** a duplicate entry number arrives via a second upload,
  **When** the dedupe detects it,
  **Then** the second source is attached to the existing entry as an additional `EntrySourceRecord` and the confidence is upgraded.
- **Given** a fuzzy match (date + IOR within tolerance, different format) is detected,
  **When** ingestion runs,
  **Then** both records are kept and a "review pair" is queued for analyst attention.
- **Given** an upload contains entries outside the IEEPA window,
  **When** ingestion completes,
  **Then** out-of-window entries are tagged but not discarded; the workspace shows them as informational.
- **Given** a malformed entry number,
  **When** parsed,
  **Then** the entry is flagged `parseStatus: 'manual'` and surfaced in the analyst queue with the raw value preserved.

## Edge case inventory

- Multiple ACE exports across different export dates → merge logic; latest export wins for any contested field, history kept.
- Customer uploads photographed paper documents → accepted, flagged `manual`, OCR deferred to Phase 2.
- Spreadsheet column headers in different languages → mapping table, common variants supported, unmapped headers prompt analyst.
- Encoded characters / smart quotes in entry numbers → normalized at ingest.
- 0-leading entry numbers stripped by Excel before upload → detection heuristic + analyst review prompt.
- Line breaks inside cells → tolerated.
- Email forward chains with multiple attachments → each attachment becomes a `RecoverySource`.
- Password-protected PDF → reject upload with clear message + offer remediation.
- File >100MB → blocked at portal with explanation; rare in practice.
- Cross-source contradictions (entry says $1,000 duty in one source, $1,200 in another) → kept as conflicting, surfaced for analyst resolution; never silently picked.
- Customer pastes entry numbers into manual-entry textarea → parsed as if from a low-confidence source.
- HTS code missing from a 7501 (rare) → entry kept; flagged `info`; analyst can fill from commercial invoice if available.
- IOR mismatch within a single upload → all entries flagged for analyst confirmation.
- Storage write failure mid-upload → idempotent retry; partial uploads are not visible until complete.
- Customer revokes consent / requests deletion → all source records and derived entries purged; audit row records the deletion event without retaining content.
- Drift in CAPE / CBP format → ingestion pinned to a format version; format updates cause batch re-validation.

## Phase 2 integrations (not v1)

- **OCR pipeline** for 7501s and carrier invoices.
- **Broker mailbox connector** — read-only IMAP per case, with explicit consent.
- **Cloud storage connectors** — Google Drive, Dropbox, OneDrive folder picker.
- **ACE export assistant** — guided export via headless browser with customer credentials (high-risk; requires careful consent UX).
- **Partner portals** — broker and 3PL data feeds.

## Design notes

### Skills

- **Taste — upload UX (customer)**: `minimalist-ui`. The upload zone + document list live in the recovery + prep workspaces (covered by PRDs 02 and 03), but their visual contract is owned here. Invoke via `/taste-skill restrained customer document upload zone with hairline border, accent progress, and typographic confirmation`.
- **Taste — extraction / review surfaces (ops)**: `industrial-brutalist-ui` Swiss mode (degradation effects disabled). Inherits ops console rules from PRD 04.
- **Pair with**: `full-output-enforcement` for the upload component and review-pair UI.
- **Other (critical)**: `test-driven-development` for canonicalization, dedupe, fuzzy match, ACE CSV parser. Golden-file fixtures for each parser. `software-architecture` when shaping the public surface of `src/contexts/entries/`.
- **Override from `docs/DESIGN-LANGUAGE.md`**: confidence pills use `--positive` / `--warning` / `--blocking` tokens — never the `industrial-brutalist-ui` aviation hazard red or the `minimalist-ui` pastel set.

### Aesthetic intent

- Upload UX is restrained — no progress confetti. A clean progress bar in the accent color, then a satisfying typographic "X documents received" confirmation.
- Document list uses Berkeley Mono for filenames and timestamps.
- Confidence pills use the design language's status colors strictly.

## Out of scope (this PRD)

- Real-time processing (workflows are async).
- ACE-to-CBP submission.
- ERP system integrations beyond CSV upload.
