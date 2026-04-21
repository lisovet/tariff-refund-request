# PRD 03 — CAPE Filing Prep

## Purpose

Turn a validated entry list into a CBP-compliant CAPE declaration CSV plus a human-reviewed **Readiness Report**. This is the **second paid step** in the funnel and is the artifact the customer pays for most directly: a file they (or their broker) can submit, accompanied by an editorial dossier that proves the work was done well.

## SKUs

| SKU | Price (SMB / Mid) | Includes |
| --- | --- | --- |
| **CAPE Filing Prep — Standard** | $199 / $499 | CSV file, validation report, prerequisites checklist |
| **CAPE Filing Prep — Premium** | $499 / $999 | Standard + analyst-prepared cover letter, batch grouping recommendation, ACE/ACH gap remediation guide |

## User journey

```
Entry list ready (from Recovery)
  │ purchase Filing Prep
  ▼
Prep workspace (customer + ops)
  │
  ▼
Automated batch validation
  │
  ▼
Analyst QA pass (mandatory)
  │
  ▼
Readiness Report drafted (human-finalized)
  │
  ▼
Customer downloads CSV + Readiness Report PDF
  │
  ▼
[Optional] Concierge upsell or self-submission
```

## Deliverables

### CAPE-ready CSV

- Conforms to the schema in `src/contexts/cape/schema.ts`.
- Row-by-row entry data with HTS codes, duty values, dates, IOR.
- Phase-segmented batches if needed.
- Validated, deduped, canonicalized.
- Filename pattern: `cape-{caseId}-{batchId}-{yyyymmdd}.csv`.

### Readiness Report (PDF + in-app)

A one-to-three-page editorial dossier:

- Masthead with case ID, customer name, prep date, reviewing analyst.
- Hero metric: `N entries validated · K blocking issues · M warnings · STATUS: READY / NOT YET`.
- Entry table (compact, mono numbers, status glyphs).
- Prerequisite checklist (ACE: ✓, ACH: ✓, IOR confirmed: ✓, Liquidation: ✓).
- Batch grouping rationale (Premium tier).
- Caveats and footnotes.
- Signed analyst footer with timestamp.

This artifact is photographable. It must look like something a CFO forwards to their board untouched.

## Validation rules (the validator)

The validator runs on every entry list and produces a `ReadinessReport` aggregate:

| Severity | Examples |
| --- | --- |
| `blocking` | Invalid entry-number format; entry outside IEEPA window; missing IOR; duplicate after dedupe; HTS code missing on a duty-bearing entry |
| `warning` | Missing liquidation status; duty value reconstructed from carrier invoice (low confidence); batch larger than recommended threshold |
| `info` | Phase boundary detected — recommend split; ACH not on file |

`blocking` issues prevent CSV download until resolved. `warning` issues are surfaced and require analyst sign-off (recorded in audit log).

## Domain model additions

```ts
Batch = {
  id, caseId, label
  entryRecordIds: EntryId[]
  phaseFlag: PhaseFlag
  validationRunId
  status: 'draft' | 'validated' | 'qa_pending' | 'ready' | 'submitted'
}

ReadinessReport = {
  id, batchId, generatedAt
  entries: { entryId, status: 'ok'|'warning'|'blocking', notes[] }[]
  prerequisites: PrerequisiteCheck[]
  blockingCount, warningCount, infoCount
  analystSignoff?: { staffUserId, signedAt, note }
  artifactKeys: { csvKey: StorageKey, pdfKey: StorageKey }
}
```

## Screens

### Prep workspace (customer)

A status-forward, low-anxiety screen:

- Status banner with current state (`Validating…` / `In QA` / `Ready`).
- Entry summary (count, total duty, batches).
- Validation summary tiles (blocking / warning / info).
- "Resolve blocking issues" CTA when relevant — opens a focused remediation list.
- "Download CSV" and "Download Readiness Report" appear only when `status = ready`.

### Prep workspace (ops)

Three-pane:
- **Left**: Batch list with status.
- **Center**: Entry table with inline validation badges; click an entry to inspect.
- **Right**: Readiness Report draft editor — pre-filled by the system, finalized by analyst.

Keyboard shortcuts: `j/k` row nav, `v` mark verified, `e` edit entry, `s` save and continue.

### Readiness Report PDF

Designed in `src/contexts/cape/report-pdf/` using React PDF. Honors the design language strictly:
- GT Sectra masthead.
- Berkeley Mono for every number, ID, timestamp.
- Hairline rules between sections.
- Real footnotes for caveats.
- Analyst signature in italic body face.

## Acceptance criteria

- **Given** a case with 50 validated entries,
  **When** Prep is purchased,
  **Then** the validator runs within 60 seconds and a draft Readiness Report is created with all blocking issues itemized.
- **Given** a Readiness Report has zero blocking issues,
  **When** an analyst signs off,
  **Then** the CSV and PDF artifacts are generated and the customer is emailed.
- **Given** an analyst attempts to mark a batch ready while blocking issues remain,
  **When** they click sign-off,
  **Then** the action is rejected and the blocking issues are surfaced in the right pane.
- **Given** a customer downloads the CSV,
  **When** they open it in Excel,
  **Then** every column header matches CAPE spec and tabular figures render correctly.
- **Given** a Readiness Report is finalized,
  **When** the customer views it in-app,
  **Then** the analyst's name, timestamp, and note are displayed.

## Edge case inventory

- Entry list has 5,000 entries → validator must paginate and stream; Inngest workflow with steps per 500-entry chunk.
- Customer requests resubmission after fix → new `Batch` and `ReadinessReport`; previous artifacts preserved (immutable).
- Analyst signs off, then customer reports an error → retraction flow with audit trail; new report re-issued.
- HTS code list update mid-case → validator pinned to a CBP-spec version per batch.
- Timezone confusion on entry dates → all dates stored UTC, displayed in customer's timezone with explicit zone label.
- Large batch exceeds CBP recommended threshold → validator emits `info` with split recommendation; Premium tier auto-suggests batches.
- Customer's IOR mismatch on subset of entries → blocking; remediation: confirm or remove.
- Currency edge cases (USD only at v1) → blocking on non-USD; future internationalization considered.
- CSV opened in Excel mangles leading zeros → CSV uses `="0001234"` formula format for entry numbers OR ships with an Excel-import guide.
- Customer downloads, edits CSV manually, then re-uploads expecting re-validation → not supported v1; surface explicit message.
- ACH gap discovered mid-prep → blocking with remediation guide (Premium); upsell to Concierge.
- Liquidation status changes between recovery and prep → re-flag and require analyst re-review.
- Concurrent edits by two analysts → row-level optimistic locking with conflict UI.
- Disclosure: PDF must include "not legal advice" footer in real footnote style — not a banner.

## Design notes (taste)

### Skills

- **Taste — customer prep workspace**: `minimalist-ui`. Invoke via `/taste-skill customer-facing prep workspace showing entry validation results and downloadable artifacts`.
- **Taste — Readiness Report PDF + engagement letter**: `minimalist-ui` editorial-document mode. Invoke via `/taste-skill one-page editorial PDF dossier with masthead, entry table, and signed analyst footer — must be photographable`.
- **Taste — ops prep + QA workspace**: `industrial-brutalist-ui`, **Swiss Industrial Print mode only** (degradation effects disabled). Invoke via `/taste-skill dense ops three-pane workspace for batch validation and Readiness Report editing with keyboard shortcuts`.
- **Pair with**: `full-output-enforcement` for the React PDF document component (long, must not truncate) and the three-pane ops workspace.
- **Other (critical)**: `test-driven-development` for the validator and CSV builder — golden-file fixtures in `tests/fixtures/cape/` are non-negotiable per ADR 014. `software-architecture` when shaping the public surface of `src/contexts/cape/`.
- **Apply from `minimalist-ui` (customer + PDF)**: editorial serif masthead, generous macro-whitespace, hairline section dividers, kbd-style chips for prereq checklist items, monospace for IDs / counts / amounts, no shadows on tiles, IntersectionObserver scroll-fade for state transitions.
- **Apply from `industrial-brutalist-ui` Swiss (ops)**: rigid CSS grid for the three-pane spine, zero `border-radius` on the validator panes, semantic `<data>` / `<output>` / `<samp>` for batch metadata, generous uppercase tracking on QA-checklist labels, bimodal density (dense entry tables next to vast whitespace around the sign-off CTA).
- **Override from `docs/DESIGN-LANGUAGE.md`**: status colors (`--positive`, `--warning`, `--blocking`) for severity glyphs are app-only; PDF uses ink + accent + a single restrained status hue per row. Never CRT scanlines / halftone / ASCII brackets in the ops view. PDF footnotes are real superscripted footnotes — not banners or pills.

### Aesthetic intent

- The Readiness Report is the product's most photographable surface. Treat it like a magazine feature.
- The hero metric on the customer-facing prep workspace uses Berkeley Mono in display size — a number with weight.
- Status colors (green / amber / red) appear only on app surfaces, never in the marketing site.
- The CSV download button is the one accent-fill on this screen — it earns the emphasis.

## Out of scope (this PRD)

- Direct CBP submission — explicitly out of scope (PRD 10 trust posture).
- Brokered submission via partner — Phase 3 (PRD 09).
- AI-drafted analyst notes — Phase 2 (PRD 08).
