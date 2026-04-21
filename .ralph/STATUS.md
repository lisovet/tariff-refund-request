# Ralph Loop Status

**Updated**: 2026-04-21T15:37:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 83 → 84)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 84 |
| in-progress | 0 |
| pending | 2 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 119 files, 1021 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | last green run this session (sandbox declined current re-run, unrelated to code) |
| `npm run qa` (combined) | green |

## Last completed task

**#84 — Cross-context lint rule + CI gate**

Tightened the ADR 001 boundary + added a permanent test that proves the rule bites:

- **`eslint.config.mjs`** `no-restricted-imports` now covers two patterns:
  1. `@contexts/*/*` with `!@contexts/*/server` exception — blocks `@contexts/<name>/repo`, `@contexts/<name>/case-machine`, `@contexts/<name>/workflows/*`, `@contexts/<name>/internals/*`. Allows `@contexts/<name>` (UI-safe surface) and `@contexts/<name>/server` (server-only surface).
  2. Relative-path escape hatch — `../contexts/*`, `../../contexts/*`, `../../../contexts/*` — blocks a source file in context A from reaching into ../B/internal via a relative path instead of the alias.
  Error messages cite ADR 001 explicitly.
- **`tests/integration/lint/cross-context-imports.test.ts`** — uses ESLint's Node API (`new ESLint().lintText`) to lint in-memory source fixtures. Five tests freeze the rule's behavior:
  1. `@contexts/ops` allowed
  2. `@contexts/ops/server` allowed
  3. `@contexts/ops/repo` blocked
  4. `@contexts/ops/workflows/stalled-cadence` blocked
  5. `@contexts/ops/case-machine` blocked
- **CI already runs `npm run lint`** via `.github/workflows/ci.yml` — rule violations fail CI from the `qa` job before the `e2e` job runs.

5 new lint-rule behavior tests. Full suite 1021/1021.

## Previously completed this wave

**#83 — USER-TEST: Ops staff complete a full case**

Codified the "two real cases end-to-end in the ops console" walkthrough as a permanent composition test (`tests/integration/ops/full-case-walkthrough.test.ts`):

- **Scenario A** — case created → walked to `batch_qa` → analyst claims (#80) → coordinator reassigns to validator (#80) → validator signs off (#65, publishes `platform/batch.signed-off`) → artifact generation handler (#70) produces CSV + PDF + Prep-Ready email. Asserts full audit chain: `SCREENER_RESULT_QUALIFIED` → `case.claimed` → `case.reassigned` → `VALIDATOR_SIGNED_OFF` → `qa.sign_off` in chronological order; artifact storage has both keys; email sent once.
- **Scenario B** — claim / release / reassign-to-unowned sequence. Asserts audit kinds are `['case.claimed', 'case.released', 'case.reassigned']` in exact order.

2 new integration tests.

## Human-verification still owes (task #83 subjective side)

- Two staff members run cases end-to-end in the live ops console; time-track each stage (claim → work → validator sign-off → artifact delivery); capture friction points as new tasks. The composition test proves the plumbing holds; the human test discovers UX drift.
- Observe: keyboard shortcut `?` discoverability, queue filter fluency, SLA badge legibility, audit-tab timeline readability, case-workspace state-adaptive surfaces match operator expectation.

## Previously completed this wave

**#82 — Keyboard shortcut overlay (?)**

Ops-console keyboard-shortcut reference:

- **`OPS_SHORTCUTS`** — declarative catalog with 9 v1 bindings across three scopes (Global / Queue / Case workspace): `?` (open reference), `g q` (go to queue), `g c` (go to last claimed), `j` / `k` (queue nav), `Enter` (open selected row), `c` (claim), `x` (stall), `/` (focus filter).
- **`ShortcutOverlay`** client component — window-level `keydown` listener for `?`; closes on `Escape` or the close button. Ignores `?` when focus is in an editable field (input / textarea / select / contenteditable) so typing into the reviewer-note surface doesn't get hijacked. Dialog is real `role="dialog"` with `aria-modal="true"`, a proper `aria-label`, and click-outside-to-dismiss.
- Grouped-by-scope rendering: each shortcut row shows the description + `<kbd>`-wrapped keys (hairline border, mono typography).
- **`(ops)/layout.tsx`** — mounts `ShortcutOverlay` at the group level so `?` works on every ops page.

9 new tests — shortcut catalog shape, default-hidden, opens on `?`, aria-modal, Escape closes, close button, ignore-when-editable.

1014/1014 pass.

## Previously completed this wave

**#81 — SLA timer + breach indicators**

Richer SLA model layered on top of the binary `isSlaBreach` flag added for the queue (task #77):

- **`src/contexts/ops/sla.ts`** — `computeSlaStatus(state, ageMs)` returns a four-band discriminated union: `{band: 'none'}` for terminal states, or `{band: 'ok' | 'warning' | 'breach', targetMs, remainingMs, elapsedPctOfTarget}`. The `'warning'` band lights up at `SLA_WARNING_PCT = 0.8` (tune point). `formatRemainingHumanized(ms)` renders `Nd / Nh / Nm` or `Nh overdue` suffix for negative remaining; `—` for no-SLA.
- **`SlaBadge.tsx`** — case-header badge keyed by band. Design-language palette: `ok → positive`, `warning → warning`, `breach → blocking`, `none → ink/60`. Three-line compact layout: SLA eyebrow / remaining-time number / label (`on track` / `due soon` / `overdue` / `no SLA`). `data-band` attribute for test + integration hooks.
- **`CaseHeaderPanel`** now renders `<SlaBadge state={caseRecord.state} ageMs={now - updatedAt} />` at the top of the left pane so an analyst sees the clock before anything else.

17 new tests — 13 SLA math (bands + boundary conditions + humanizer) + 4 badge (one per band path).

Public surface on `@contexts/ops` exports the SLA types + helpers.

1005/1005 pass — first time the suite crosses four digits.

## Previously completed this wave

**#80 — Case claim / release / assignment**

Ownership lifecycle for ops cases per PRD 04:

- **`CaseRepo.casSetOwner({caseId, expectedOwnerStaffId, nextOwnerStaffId, occurredAt})`** — optimistic-concurrency compare-and-swap on `ownerStaffId`. In-memory impl checks + swaps; Drizzle impl pins the expected owner in the WHERE clause so a racing UPDATE matches zero rows and the service treats the empty result as a CAS miss. `isNull` handles the null-expected case correctly.
- **`src/contexts/ops/assignment.ts`** service layer:
  - `claimCase({caseId, actor}, deps)` — any staff role may claim; idempotent self-claim returns `{ok:true, alreadyOwned:true}` without an audit row; already-owned returns `{ok:false, reason:'already_claimed', currentOwnerStaffId}`; CAS miss re-reads to surface the actual winner. Non-staff actors rejected with `not_staff`.
  - `releaseCase({caseId, actor}, deps)` — owner-of-record OR admin may release; non-owner non-admin rejected with `not_owner`; unowned case rejected with `not_claimed`.
  - `reassignCase({caseId, actor, toStaffId}, deps)` — coordinator + admin only; analyst / validator rejected with `not_authorized`; can reassign an unowned case directly.
- Every successful action writes an audit row — `case.claimed` / `case.released` / `case.reassigned` — with `{fromOwnerStaffId, toOwnerStaffId}` payload so the timeline renders attribution.

14 new tests including a real race: `Promise.all` of two concurrent claims → exactly one wins (idempotency check on the result array).

Public surface exports the services + types from `@contexts/ops`.

988/988 pass.

## Previously completed this wave

**#79 — Case timeline + audit log viewer**

Replaces the #78-era placeholder in the CaseSidePanel's Audit tab with a real timeline viewer:

- **`AuditTimeline.tsx`** — pure-display component. Input is `AuditTimelineEntry[]` (plain JSON shape, `occurredAtIso: string`). Renders chronological left-ruled list, each row with mono timestamp (`yyyy-mm-dd HH:MM UTC`), uppercase mono kind tag, `from → to` state pair when both present, `by <actorId>` / `by system` attribution, and a secondary line for well-known payload shapes (`admin.note` / `qa.sign_off` → renders the note verbatim; `customer.deleted` → counts-only summary, never PII).
- **`CaseSidePanel`** gains an `auditEntries?` prop; Audit tab now renders `AuditTimeline` instead of the placeholder sentence.
- **`/ops/case/[id]/page.tsx`** maps `CaseRepo.listAudit(caseId)` output to `AuditTimelineEntry` (Dates → ISO) and passes them through.

10 new tests covering: ordering (chronological), transition-pair rendering, non-transition rows skip the arrow, actor-id + `system` fallback, kind/timestamp formatting, deletion-audit counts-only render (no PII leak), admin-note secondary-line, empty-state.

The existing integration test for the case workspace page was updated to register `listAudit` on the stubbed repo; the CaseSidePanel tabbed-shell test updated to expect the new empty-state string.

974/974 pass.

## Previously completed this wave

**#78 — Case workspace shell (3-pane layout)**

Two new components promote the /ops/case/[id] workspace from a state-agnostic 3-pane to a state-adaptive one per PRD 04:

- **`WorkSurface.tsx`** — center pane dispatcher. Picks the right surface per `CaseState`: `awaiting_docs` / `entry_recovery_in_progress` → ExtractionFormPanel; `entry_list_ready` → entry-list card; `cape_prep_in_progress` → CAPE-prep card; `batch_qa` → validator-signoff card; `submission_ready` → ready-for-filing card; `concierge_active` → concierge-coordination card; `filed` / `pending_cbp` → pending-CBP card; `deficient` → deficiency-response card; `stalled` → stalled card; `paid` / `closed` / `disqualified` → terminal read-only card; intake states (`new_lead`, `qualified`, `awaiting_purchase`, `awaiting_prep_purchase`) → pre-purchase placeholder. Every surface includes the eyebrow with the literal state id for orientation.
- **`CaseSidePanel.tsx`** — right pane becomes a tabbed `Documents` / `Audit` widget (real `role="tab"` / `role="tabpanel"` semantics, keyboard-operable). Docs tab reuses `DocumentViewerPanel` (task #47); Audit tab is the placeholder that the full audit-log viewer lands into via task #79.
- `/ops/case/[id]/page.tsx` wired to consume both — the 3-pane grid layout was already in place, now drives state-adaptive center + tabbed right.

15 new tests (9 WorkSurface state-dispatch + 6 CaseSidePanel tabbed-shell).

964/964 pass.

## Previously completed this wave

**#77 — Queue list page + filters + saved views**

Ops-console queue surface per PRD 04:

- **`src/contexts/ops/queue.ts`** — pure helpers: `SLA_TARGETS_BY_STATE` (per-state millisecond budgets; terminal states undefined), `computeQueueRow(case, now)` derives `{id, state, tier, ownerStaffId, ageMs, ageHumanized, isSlaBreach, updatedAtIso}`, `filterQueue(cases, filter)` composes state / owner / tier filters (ownerStaffId `null` filters unassigned), `SAVED_VIEWS` (Unassigned / My batch QA / Stalled / All active) + `resolveSavedView(id, viewer)` that binds `my_batch_qa` to the authenticated staff id.
- **`CaseRepo.listCases(input?)`** method added on both in-memory + Drizzle impls (updatedAt desc, optional limit + offset).
- **`src/app/(ops)/ops/page.tsx`** — server-rendered queue page. Guards via `requireStaff(await resolveCurrentActor())`. URL-params drive filtering: `?view=<saved-view-id>` wins over `?state` / `?owner`. Saved-view chips render above the table; active view underlined via the magazine-underline pattern.
- **`QueueTable.tsx`** — dense editorial-industrial table with Berkeley-Mono case id + age columns, state chips, hairline dividers, SLA breach accent on the age cell + a right-aligned `SLA` badge. Empty state renders "Queue empty" with the italic mono voice.
- Public surface on `@contexts/ops`: queue helpers exported.

24 new tests (19 queue helpers + 5 QueueTable component).

949/949 pass.

## Previously completed this wave

**#76 — USER-TEST: Trust posture review**

Codified the trust-posture consistency bar as a permanent integration test (`tests/integration/trust/posture-review.test.tsx`). One composite walkthrough exercises every trust surface and asserts:

1. `/trust` renders the canonical promise clauses verbatim + non-goals + disclosure.
2. `/trust/security` renders the six required sections AND the active v1 sub-processor count sourced from `@shared/trust/sub-processors` (drift-proof).
3. `/trust/sub-processors` renders every vendor + the list-version stamp.
4. Every registered engagement letter passes every `REQUIRED_CLAUSES` probe that applies to its SKU.
5. `concierge-v1` carries `CANONICAL_TRUST_PROMISE` + `NOT_LEGAL_ADVICE_DISCLOSURE` verbatim after interpolation.
6. Readiness Report PDF end-to-end: `%PDF-` magic header + the case id appears UTF-16BE encoded in the info dictionary.
7. Prep-ready email carries `NOT_LEGAL_ADVICE_DISCLOSURE` via `EmailLayout`.
8. Deletion worker audit payload is content-free — no `email`, `fullName`, or `name` keys; serialized JSON does not contain the fixture PII values.
9. Canonical trust promise paraphrase tripwire — the four stable clauses + `SUBMISSION_CONTROL_CLAUSE` checked against their frozen strings.

15 new tests. Wave 12 (Trust posture + engagement letter) + Wave 11 surface checks all green on the same fixture path.

925/925 pass.

## Human-verification still owes (task #76 subjective side)

- Founder + outside reviewer (customs / contract lawyer if available) read `/trust`, `/trust/security`, `/trust/sub-processors`, the rendered `concierge-v1` engagement letter (via `renderAgreement`), and a real Readiness Report (`npm run report:sample` produces a sample) top to bottom. Assess: are the legal commitments acceptable, is the tone appropriate for customer + their counsel, are there ambiguities in the success-fee mechanic, does the retention language match what the product actually does.
- Legal sign-off on the AAA arbitration clause + governing-law state choice before the first real Concierge purchase.

## Previously completed this wave

**#75 — Customer data export + deletion endpoints**

New `src/contexts/identity/data-rights/` module implementing PRD 10 §Your rights acceptance criteria:

- **`exportCustomerData({customerId}, deps)`** — returns `{ok:true, export: CustomerExport}` with the customer's identity + every case + every audit entry, all dates ISO-serialized so the payload is JSON-safe. `customer_not_found` discriminated-union failure when the id doesn't resolve.
- **`requestCustomerDeletion({customerId, reason}, deps)`** — enqueues a deletion request with `scheduledFor = now + DELETION_SLA_DAYS` (30 days). Idempotent on customerId: a second request returns the existing queued record with `replay: true`.
- **`processPendingDeletions(now, deps)`** — worker that picks every queued request with `scheduledFor ≤ now` and purges its cases + audit rows + customer row. Before purge, writes a **content-free** audit row via the injected `globalAuditSink` — `{kind: 'customer.deleted', customerId, deletionRequestId, counts: {casesDeleted, auditRowsDeleted}}`. No PII in the audit payload.
- **`createInMemoryDeletionRepo()`** — v1 seam for the `customer_deletion_requests` store; Drizzle cutover is a follow-up.
- **Repo surface extensions**: `CaseRepo.listCasesByCustomer(customerId)` + `CaseRepo.deleteCaseAndAudit(caseId)` (both in-memory + Drizzle impls); `IdentityRepo.findCustomerById(id)` + `IdentityRepo.deleteCustomer(id)` (both impls).

9 new tests: export (customer record + cases + audit + empty-cases + ISO serialization + not-found), deletion (queueing with 30-day SLA, idempotency, worker purges + counts-only audit row, early-schedule skip, idempotent re-run no-op).

910/910 pass.

## Previously completed this wave

**#74 — /trust/security page + sub-processor automation**

Single-source extraction + new security page per PRD 10:

- **`src/shared/trust/sub-processors.ts`** — promoted the inlined list on the existing sub-processors page into a shared module. `SUB_PROCESSORS` (11 entries: 9 v1 + 2 Phase-2), `SUB_PROCESSOR_CATEGORIES` (infrastructure / auth_payments / workflow_comms / observability / ai_ocr), `SUB_PROCESSORS_LIST_VERSION` integer (bumping triggers Phase-1 lifecycle notification), `getActiveV1SubProcessors()` / `getSubProcessorsByCategory()` helpers. 9 new unit tests freeze shape, uniqueness, category enumeration, Phase-2 flagging, and version discipline.
- **`/trust/sub-processors` page** — refactored to import from the shared module. Renders a "List version vN" footer (surfaced so customers + security auditors see the version they're reading).
- **`/trust/security` page** — new editorial page with six sections per PRD 10 §Security posture: Authentication (Clerk + MFA + scoped middleware), Storage & encryption (Neon + R2, case-scoped keys, at-rest), Retention (case data / uploads / marketing / deletion timelines), Access control (full staff role table — coordinator / analyst / validator / admin with scope statements), Incident response (72-hour notification, 4-hour RTO backup restore), Sub-processors summary (reads the active v1 count from the shared module so drift is impossible). 9 component tests.
- Route metadata exposes `title: 'Security'` + description; SEO-legible.

Link from /trust/security to /trust/sub-processors keeps the documents navigable as a pair.

901/901 pass; lint + typecheck clean; build green (25 routes — `/trust/security` at 174B).

## Previously completed this wave

**#73 — E-sign flow integration**

Full e-sign adapter + payment gate per PRD 10 §Engagement letters:

- **`ESignProvider` contract** + in-memory stub (`createInMemoryESignProvider`). Real DocuSign/HelloSign/BoldSign implementation is a TODO(human-action) at the env boundary — the contract + test seam are ready.
- **`SignedAgreementRepo`** (contract + in-memory impl) — persists rendered-body archival snapshots, `agreementId` + `version`, envelope id UNIQUE, status (pending / signed / voided).
- **`requestConciergeSignature(input, deps)`** — resolves concierge-v1, renders with all six variables, requests envelope via provider, records pending row, returns `{envelopeId, signingUrl, agreementId}`. Refuses non-concierge SKUs (lightweight clickwrap doesn't use this flow).
- **`handleSignatureCompleted(input, deps)`** — idempotent webhook handler: already-signed envelopes short-circuit without republishing; unknown envelopes return `envelope_not_found` discriminated-union failure. On first write, publishes `platform/concierge.signed`.
- **`conciergeCheckoutGate(repo)`** — read-side gate for consumers about to open Checkout: `canOpenCheckout(caseId)` refuses with `no_signed_agreement` until a signed record exists.
- **`conciergeCheckoutOnSignedWorkflow`** — Inngest workflow triggered by `platform/concierge.signed`. Calls existing `createCheckoutForSku` with `envelopeId` as the idempotency scope so retries dedupe server-side. Refuses non-concierge SKUs (defense in depth).
- **Event** `platform/concierge.signed` added to the typed catalog.
- `src/contexts/billing/server.ts` gains `getStripeCheckoutClient()` + `getAppOrigin()` helpers used by the workflow at invocation time.

Public surface on `@contexts/billing`: e-sign types + factories + services all re-exported.

13 new tests: 10 e-sign (request flow + idempotency + gate + provider + repo), 3 workflow (opens Checkout, refuses non-concierge, envelope-scoped idempotency).

## Human-verification still owes (task #73)

- Choose a production e-sign provider + wire its real adapter; the stub is the test seam, not the shipping implementation.
- Wire the provider's webhook signature verification (`verifyWebhook` hook in the `ESignProvider` contract) before enabling prod traffic.
- Drizzle persistence for `signed_agreements` (the in-memory repo is the v1 seam; schema migration lands with the real-DB cutover).
- End-to-end Playwright spec against the provider sandbox (skipped for v1 because no provider selected).

## Previously completed this wave

**#72 — Engagement letter templates + version registry**

New `src/contexts/billing/agreements/` package:

- **`concierge-v1.body.ts`** — full Concierge engagement letter (11 sections): scope, what-we-do-not-do, trust posture, deliverables, success-fee mechanic, non-negotiable human review, confidentiality + data handling, AAA arbitration dispute clause, governing law, termination, entire agreement. Embeds `CANONICAL_TRUST_PROMISE` + `NOT_LEGAL_ADVICE_DISCLOSURE` verbatim via the shared disclosure module (single source of truth). Twin `concierge-v1.md` for legal review + out-of-band diffs.
- **`recovery-prep-v1.body.ts`** — lightweight clickwrap for Recovery Kit + CAPE Prep (6 sections) with the 14-day refund window. Twin markdown for legal.
- **`registry.ts`** — `AGREEMENTS` map keyed by `AgreementId`, `resolveAgreement(sku)` lookup, `renderAgreement(id, vars)` with `{{PLACEHOLDER}}` interpolation that throws on missing variables (no dangling templates shipped), `REQUIRED_CLAUSES` tripwire list (`not_legal_advice`, `not_a_customs_broker`, `canonical_trust_promise` — Concierge only, `version_stamp`).
- Public surface: `AGREEMENTS` / `REQUIRED_CLAUSES` / `renderAgreement` / `resolveAgreement` exported from `@contexts/billing`.

23 tests cover: registry shape (every SKU has coverage), resolution (concierge vs recovery-kit vs cape-prep), required-clause enforcement (every agreement passes its applicable clauses, with `applies()` gate so Concierge gets the full promise and lightweight clickwrap is correctly exempted), rendering (interpolates all six variables, throws on missing vars + unknown ids, verbatim carries the canonical trust promise + NOT_LEGAL_ADVICE_DISCLOSURE), Concierge scope assertions (success fee + dispute resolution + governing law interpolation).

870/870 pass.

## Previously completed this wave

**#71 — USER-TEST: Photographable Readiness Report**

Codified the "CFO-forward-unchanged" quality bar as a permanent integration test (`tests/integration/cape/photographable-report.test.ts`). A realistic 12-entry batch (Pioneer Optics Corp across four IOR prefixes, dates Jul–Oct 2024, $67K–$412K line items, one warning-severity entry) runs through `validateBatch` → `artifactGenerationHandler`; the test asserts:

- PDF starts with `%PDF-` magic header, byte length in plausible one-page editorial range (2KB..120KB).
- Case id appears in the PDF info dictionary as the UTF-16BE encoded byte sequence.
- CSV contains every entry number verbatim + the frozen CBP-compatible header row.
- Prep-ready email carries the signed PDF URL + `NOT_LEGAL_ADVICE_DISCLOSURE` (from the shared disclosure module via EmailLayout) + correct `batch-signed-off:` idempotency key.
- Storage keys stay inside the case-scoped prefix (tripwire for cross-customer leaks).

Also added `scripts/generate-sample-readiness-report.ts` + `npm run report:sample` that writes a real PDF to `tmp/readiness-report-sample.pdf` for human eyeball review. First run succeeds (7.7KB PDF). `tmp/` added to `.gitignore`.

Scripts tsconfig updated: `jsx: react-jsx` + `.tsx` includes, so the render script transpiles JSX via tsx's esbuild runtime.

847/847 pass.

## Human-verification still owes (task #71 subjective side)

- Founder + design reviewer: open `tmp/readiness-report-sample.pdf` (regenerate via `npm run report:sample`) and confirm it would survive being forwarded to a CFO without changes. Specifically assess: editorial typography restraint, table rhythm, sign-off attribution prominence, disclosure legibility, absence of AI-stock aesthetics.
- Drop licensed GT Sectra + Söhne + Berkeley Mono TTFs into `public/fonts/` (PDF still renders with Times/Helvetica/Courier fallbacks — tracked as TODO(human-action) in `fonts.ts`).

## Previously completed this wave

**#70 — Artifact generation pipeline + R2 storage**

New Inngest workflow drives the post-sign-off delivery loop:

1. **`platform/batch.signed-off` event** (`src/shared/infra/inngest/events.ts`) — carries the full readiness report + entries + customer + analyst identity so the workflow can regenerate CSV + PDF without a readiness-report repo.
2. **`artifactGenerationHandler`** (`src/contexts/cape/workflows/artifact-generation.ts`) — pure handler that walks `step.run()` through: build-csv (respects blocking-issues gate defense-in-depth), render-pdf (with the full sign-off + prerequisites body), upload-csv (Cloudflare R2 / MinIO / memory via `StorageAdapter`), upload-pdf, sign-csv-url, sign-pdf-url, send-prep-ready-email (Resend idempotency-keyed on `batch-signed-off:${batchId}`). Keys are case-scoped: `cases/{caseId}/cape-{batchId}/readiness.{csv,pdf}`.
3. **`artifactGenerationWorkflow`** — Inngest-wrapped entry point registered in the workflows index.
4. **`signOffBatch` publisher hook** — `SignOffBatchDeps.publishBatchSignedOff` is optional; when supplied along with `input.artifactContext` (entries + customer + workspace URLs), sign-off publishes the event after a successful transition + audit write. Publisher failures are swallowed — the case is already in `submission_ready` and the artifact pipeline is retried externally.
5. **New `src/contexts/cape/server.ts`** — server-only surface exposing the workflow + PDF rendering. Mirrors the pattern used by the screener/ops contexts.

Handler discriminated-union results: `{ok:true, csvKey, pdfKey, csvSignedUrl, pdfSignedUrl, emailMessageId}` or `{ok:false, reason: 'blocking_issues_present' | 'csv_build_failed' | 'unexpected_error'}`.

8 new tests: 5 for the handler (happy path, idempotency, blocking-refusal, empty-entries refusal, key-layout regex), 3 for sign-off publish behavior (publishes full payload, skips without artifactContext, swallows publisher error).

846/846 pass.

## Previously completed this wave

**#69 — Footnotes, signed footer, disclosures**

Extracted the canonical disclosure strings into a shared, JSX-free module (`src/shared/disclosure/constants.ts`) so the Readiness Report PDF + email templates + Next UI all import from one source. `src/app/_components/ui/Disclosure.tsx` + `src/shared/infra/email/templates/_layout.tsx` re-exported / re-imported accordingly.

Three new PDF components:

1. **`SignOffBlock.tsx`** — the analyst reviewing-attribution block per the disclosure rule (*"Readiness Report… always names the validator and timestamp"*). Paper-toned card with ink border, GT Sectra analyst name, Berkeley Mono timestamp, and the validator's note. Empty-note case renders an italic fallback — no Readiness Report ships without attribution.
2. **`Footnotes.tsx`** + **`FootnoteMarker`** — numbered footnotes at the end of the body (`[1]`, `[2]`...) referenced inline via `FootnoteMarker({ index })`. Real text — no circled-digit glyphs that break screen readers.
3. **`DisclosureFooter.tsx`** — the per-page fixed footer block now renders four lines verbatim from the shared disclosure module: "Not legal advice" eyebrow, `SUBMISSION_CONTROL_CLAUSE`, `CANONICAL_TRUST_PROMISE`, and `NOT_LEGAL_ADVICE_DISCLOSURE`. Old `<Text fixed>` one-line footer retired.

`ReadinessReportBody` gained two optional fields: `signoff: SignOffBlockProps` + `footnotes: FootnoteItem[]`. `ReadinessReportDoc` composes them after the prerequisites list.

Test suite additions: `src/shared/disclosure/__tests__/constants.test.ts` (6 tests freezing the four canonical strings) + `src/contexts/cape/report-pdf/__tests__/footer-sections.test.ts` (16 tests: SignOffBlock attribution + timestamp + note paths, FootnoteMarker numeric + multi-digit, Footnotes ordering + verbatim body + empty case, DisclosureFooter verbatim on three clauses, full integration tree-walk asserting the canonical promise + sign-off + timestamp appear in the report).

The tree-walk helper was upgraded to invoke pure function-components inline so tests can traverse the full composed tree (react-pdf components don't execute until render).

838/838 pass.

## Previously completed this wave

**#68 — Hero metric + entry table + prerequisites**

Three PDF-body components under `src/contexts/cape/report-pdf/`:

1. **`HeroMetric.tsx`** — GT Sectra 28pt "N entries reviewed" hero line + three Berkeley-Mono badges (blocking / warnings / info). State-color tokens: blocking `#8A1F1F`, warning `#7A5A1A`, positive `#1D6B3C`. Zero-count badges tint positive; non-zero tint by severity — meaning-bearing color per DESIGN-LANGUAGE.md.
2. **`EntryTable.tsx`** — Flex-row typeset table (no DOM `<table>` in react-pdf). Columns: status glyph / entry number / date / IOR / duty USD (right-aligned, Berkeley Mono tabular figures). Rows with notes render a secondary indented row under each data row. Exports frozen `STATUS_GLYPHS = { ok: '○', warning: '△', blocking: '×' }` — real Unicode, no emoji, assistive-tech-readable.
3. **`PrerequisitesList.tsx`** — Hairline-separated list of `PrerequisiteCheck` with ✓ / ✕ markers (green / red) + right-aligned "Met" / "Missing" mono label.

`ReadinessReportDoc.tsx` extended: new `ReadinessReportBody` prop (totalEntries / blockingCount / warningCount / infoCount / entryRows / prerequisites). When `body` is supplied the three sections render in order; when omitted, the masthead-only scaffold from #67 still renders (backwards-compatible).

10 new component tests (`body-sections.test.ts`) + 2 new integration tests (`report.test.ts` — full-body render yields >1.5KB buffer + tree-walk asserts disclosure still appears). Total PDF tests: 19.

816/816 pass.

## New task added this iteration

**#401 — AI-assist marketing copy + explainer modules across funnel**

Post-v1 (id > 86) growth task capturing the user's mandate to surface "how the platform uses AI to maximize an importer's IEEPA refund" across the funnel without breaking the trust posture. Eight placements: homepage AI section, /how-it-works AI stage, /cape-prep AI value strip, screener-results AI-confidence line, Readiness Report PDF "How we reviewed" paragraph, engagement-letter AI clause, /trust AI disclosure, two transactional-email lines. Constraints: every surface names the human-validator-final gate; no AI-copy clichés; every claim backed by a real code path. Depends on #14, #15, #17, #24, #68, #72.

## Human-verification still owes

- Drop licensed GT Sectra + Söhne + Berkeley Mono TTFs into `public/fonts/` and update `fonts.ts` to register them.
- Eyeball a rendered PDF with a real 100-entry broker fixture once #69 layers in the sign-off block.

## Next eligible

- Task #85 — deps satisfied. **Eligible — lowest id.** (Internal funnel metrics instrumentation.)
- Task #86 — final USER-TEST (Phase 0 launch readiness review).

## Notes

- 84/86 v1 done — 97.7% of Phase 0. Two tasks remain (#85 funnel metrics, #86 launch readiness).
- Post-v1 backlog: AI-copy funnel task **#401**, and now **#402 — Production deploy** (full checklist: Vercel + Neon migrations + R2 buckets + Clerk prod org + Stripe live + Resend DKIM/SPF + Inngest prod + Sentry + Axiom + E-sign provider wiring + 12-step staging smoke + launch gates). Depends on #86 (final USER-TEST launch readiness review).
- Loop will continue with #82 next iteration.
