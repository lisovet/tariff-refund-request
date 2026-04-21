# Ralph Loop Status

**Updated**: 2026-04-21T13:57:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 70 → 71)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 71 |
| in-progress | 0 |
| pending | 15 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 101 files, 847 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 24 routes |
| `npm run qa` (combined) | green |

## Last completed task

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

Per dependency check (v1 only):
- Task #72 — deps satisfied (71 done). **Eligible — lowest id.** (Engagement letter templates + version registry.)
- Task #74 — eligible.
- Task #75 — eligible.
- Task #77 — eligible.

Lowest-id eligible is **task #72**.

## Notes

- 71/86 v1 done — 82.6% of Phase 0. Wave 11 (Readiness Report PDF) checkpointed.
- Post-v1 backlog includes AI-copy funnel task #401.
- Loop will continue with #72 next iteration.
