# PRD 02 — Entry Recovery

## Purpose

Help a customer who does not have a clean entry list assemble one. This is the **first paid step** in the funnel and the product's true wedge: most importers cannot file because they cannot find their entry numbers. We monetize that pain directly via two SKUs (Recovery Kit, Recovery Service) and route the workflow by source path (broker / carrier / ACE).

## Two SKUs

| SKU | Price (SMB / Mid) | What customer gets | Internal cost shape |
| --- | --- | --- | --- |
| **Recovery Kit** | $99 / $299 | Path-specific outreach templates, document checklist, secure upload portal, written walkthrough | Mostly self-serve, light support |
| **Recovery Service** | $299 / $499 | Everything in Kit + analyst-assisted extraction, follow-up coordination, document parsing | Human-hours per case, capped |

## Recovery paths (driven by ADR 015)

The screener's `recoveryPath` output drives the experience.

### Broker path

Customer used a third-party customs broker (Flexport, Livingston, Rodman, etc.).

- Generated outreach kit: a personalized email template the customer can copy-send to their broker requesting all entry summaries for the IEEPA window.
- Document checklist: 7501 entry summaries, broker spreadsheets, broker invoices.
- Secure upload portal accepts PDFs, XLSX, CSV, EML.
- Service variant: analyst follows up with the customer if no upload arrives in 4 business days; offers to draft a second-touch email; can extract from forwarded emails.

### Carrier path

Customer's clearance was handled by DHL / FedEx / UPS as part of express shipping.

- Carrier-specific instructions to retrieve duty invoices from each carrier's portal.
- Document checklist: carrier duty invoices, commercial invoices, MAWB references.
- Service variant: analyst can interpret carrier invoice formats and reconstruct entries from invoice metadata where possible.

### ACE self-export path

Customer is registered in ACE and can export their own entry data.

- Walkthrough (screen-by-screen) for the ACE portal export.
- CSV-format guidance.
- Service variant: analyst can join a 30-minute screen-share to walk through the export.

### Mixed path

Combination of the above. The recovery workspace lets the case carry multiple `RecoverySource` records, each with their own provenance and confidence.

## User journey

```
Results page
  │ purchase Kit or Service
  ▼
Welcome / orientation screen
  │
  ▼
Recovery workspace (customer)
  ├─ Outreach kit (email template, copy/send)
  ├─ Document checklist (path-specific)
  ├─ Secure upload (drag-drop, multi-file)
  └─ Status banner: "We'll email you when your entries are validated"
  │
  ▼
[Service variant: ops staff works the case in parallel]
  │
  ▼
Entry list ready notification (email + in-app)
  │
  ▼
Hand-off to CAPE Filing Prep checkout
```

## Screens

### Welcome / orientation (post-purchase)

A single editorial card explaining what happens next, in three numbered movements. Sets expectations: timing, what we do, what they do, when they will hear from us.

### Recovery workspace (customer)

Three-pane layout:
- **Left**: Status banner + checklist (documents requested, documents received, missing items).
- **Center**: The outreach kit (one large copy-to-clipboard email template; sender name, subject, body, attachments-needed list).
- **Right**: Secure upload zone, with file preview list below.

### Document upload modal

- Drag-drop or browse.
- Accepted types listed in mono.
- Per-file inline preview after upload.
- Each file gets a `RecoverySource` record with `path`, `uploadedAt`, `confidence: pending`.

### Ops view (recovery workspace, staff)

Same case, different lens. Adds:
- Side-by-side document viewer + entry-extraction form.
- "Mark entry source as verified" action.
- Internal notes log.
- SLA timer (color-coded against path SLA).

## Domain model additions

```ts
RecoveryPath = 'broker' | 'carrier' | 'ace-self-export' | 'mixed'

RecoveryPlan = {
  path: RecoveryPath
  outreachTemplate: EmailTemplate
  acceptedDocs: DocType[]
  opsQueue: 'recovery-broker' | 'recovery-carrier' | 'recovery-ace'
  sla: { firstTouchHours: number, completionHours: number }
  prerequisiteChecks: PrerequisiteCheck[]
}

RecoverySource = {
  id, caseId, path, kind: DocType, uploadKey, uploadedAt
  uploadedBy: 'customer' | 'staff'
  confidence: 'pending' | 'verified' | 'rejected'
}

EntryRecord = {
  id, caseId, entryNumber, entryDate, importerOfRecord
  dutyAmountUSD, htsCodes[], phaseFlag
  sourceRecordId           // provenance — never null
  confidence: ConfidenceScore
  validatedAt, validatedBy
}
```

## Acceptance criteria

- **Given** a customer purchases Recovery Kit (broker variant),
  **When** the workspace loads,
  **Then** the outreach template is pre-filled with their company name and the broker checklist appears.
- **Given** a Recovery Service customer,
  **When** 96 hours pass with no upload,
  **Then** a follow-up email is queued via Inngest and the case moves to `Stalled — Awaiting Customer`.
- **Given** an analyst extracts entries from a 7501,
  **When** they save the entry,
  **Then** the `EntryRecord` carries the `sourceRecordId` and an `audit_log` entry records the analyst's user id.
- **Given** a duplicate entry number is detected across uploads,
  **When** the system flags it,
  **Then** the workspace surfaces a one-click "merge" action with a side-by-side comparison.
- **Given** a customer wants to skip ahead to CAPE Prep,
  **When** their entry list is incomplete,
  **Then** the system warns them with a soft block, offering to continue with a confidence note rather than a hard stop.

## Edge case inventory

- Customer uploads 200 files at once → batch upload UI, server-side throttling, idempotent storage keys.
- Uploaded file is corrupt or password-protected → reject with a clear error and an in-line "we can help" path.
- Customer forwards an email chain that contains the broker's reply with attachments → extractor handles `.eml` and surfaces attachments individually.
- Customer pastes entry numbers manually instead of uploading → manual-entry UI with paste-friendly textarea and Berkeley Mono input rendering.
- ACE export contains entries outside the IEEPA window → window filter applied, with clear "X of Y entries fall in scope" surfacing.
- Carrier invoice does not contain entry numbers → flagged as "metadata-only," analyst reconstructs entries via supplementary data, confidence: low.
- Customer reports broker is uncooperative → escalation flow surfaces concierge upsell.
- Customer's IOR is a different legal entity than expected → confirmation dialog before saving.
- File contains PII beyond what we need → not redacted at upload (we keep original), but the readiness report extracts only the relevant fields.
- Multi-tenant: customer has two brands under one IOR → each brand its own `Case`; UX supports linked cases.
- Withdrawal: customer cancels mid-case → refund logic per ADR 005, documents retained per retention policy or purged on request.
- Concurrent uploads from customer + staff → optimistic UI with last-write-wins conflict surfacing.
- Rate-limit abuse on uploads → per-customer quota with override for paid-service tier.
- Storage failure → retries via Inngest workflow; customer never sees a half-uploaded state.
- Customer changes recovery path mid-case (started broker, realizes ACE works) → workspace supports adding a second path; previous outreach kit archived but not deleted.

## Design notes (taste)

### Skills

- **Taste — customer workspace**: `minimalist-ui`. Invoke via `/taste-skill recovery workspace for an importer to receive an outreach kit and upload customs documents`.
- **Taste — ops workspace** (three-pane PDF + extraction form): `industrial-brutalist-ui`, **Swiss Industrial Print mode only** (degradation effects disabled). Invoke via `/taste-skill dense ops console workspace with side-by-side PDF viewer and tabular entry-extraction form, Bloomberg-terminal energy`.
- **Pair with**: `full-output-enforcement` for the three-pane workspace components on both surfaces.
- **Other**: `test-driven-development` for routing logic and outreach-template snapshots; `software-architecture` when building the public surface of `src/contexts/recovery/`.
- **Apply from `minimalist-ui` (customer)**: hairline-bordered upload zone with no cloud illustration, generous internal padding on the three-pane shell, accent-only progress on upload, IntersectionObserver scroll-fade for status changes.
- **Apply from `industrial-brutalist-ui` Swiss (ops)**: rigid CSS Grid with `gap: 1px` for the three-pane spine, zero `border-radius` on the work surface, monospace dominance for entry numbers / dates / IDs, generous tracking on uppercase queue labels, `<dl>` / `<data>` / `<samp>` semantics in the extraction form.
- **Override from `docs/DESIGN-LANGUAGE.md`**: customs-orange `--accent` substitutes for both `minimalist-ui` pastel accents and `industrial-brutalist-ui` aviation hazard red. CRT scanlines, halftone, ASCII brackets `[ ... ]`, viewport-bleeding numerals, "REV/UNIT" decoration strings — all banned. No phosphor-green Tactical Telemetry mode.
- **Cross-cutting** (per `docs/SKILLS-ROUTING.md`): `planner` → `coder` → `qa-monkey` (esp. concurrency on simultaneous staff edits) → `judge` → `ship`. `debugger` for upload-flow incidents.

### Aesthetic intent

- The outreach template is the workspace's hero. It must read like a thoughtful email a competent person would actually send — not a form letter. GT Sectra subject line preview, Söhne body, Berkeley Mono for the entry-window dates.
- The checklist uses typographic status glyphs (`✓`, `—`, `?`) in the accent face, not iconographic checkmarks.
- The upload zone has a hairline-bordered, ink-on-paper texture — never a friendly cloud illustration.
- Status banner stays anchored at the top per design language.

## Out of scope (this PRD)

- OCR / automated entry extraction (Phase 2 — see PRD 08).
- Direct integrations to broker portals or carrier APIs (Phase 2).
- Email-mailbox connector (Phase 2).
