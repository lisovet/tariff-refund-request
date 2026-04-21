# Ralph Loop Status

**Updated**: 2026-04-21T12:00:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 54 → 55)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 55 |
| in-progress | 0 |
| pending | 31 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 84 files, 637 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 24 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#54 — USER-TEST checkpoint #8 (full recovery workflow)**

Implementation-side scaffolding for the four legs of the workflow is complete:

1. **Stripe Checkout** (#36) — `POST /api/checkout` opens a Session per `(sku, tier)`; `/api/webhooks/stripe` dedupes via `processed_stripe_events` UNIQUE + publishes `platform/payment.completed`.
2. **Customer recovery workspace** (#51) — `/app/case/[id]/recovery`: 3-pane with status banner, outreach kit, upload zone; renders correctly given a case + screener-session pair.
3. **Ops workspace + extraction form** (#52, #53) — `/ops/case/[id]`: case header + extraction form + side-by-side document viewer; `POST /api/cases/[id]/entries` persists entry + entry_source_record + audit_log row inside one `db.transaction`; idempotent on `(case_id, entry_number)`.
4. **Lifecycle email cadences** (#28-#31) — workflows registered for screener nudges + entry-list-ready + concierge upsell + reengagement.

**Gaps for the human walk** (carried from #38):
- Webhook does not yet write a Payment row OR auto-create a Case from `platform/payment.completed`. The orchestration workflow that closes this is the missing seam — without it the human walk needs to manually create a Case before `/app/case/[id]/recovery` resolves.
- Extraction form's `recoverySourceId` prop is currently static — wiring DocumentViewerPanel's active doc → ExtractionFormPanel.recoverySourceId is a follow-up; for v1 the wiring requires a `recovery_source` row to exist for each uploaded document, which is also a missing seam.

## Human-verification still owes

- Provision Stripe test mode + R2 + Inngest dev server + Postgres.
- Manually create a case + recovery_source for a customer.
- Walk the customer through the workspace → upload → staff opens ops workspace → extracts an entry → confirm audit trail in the database.
- The end-to-end orchestration workflow that closes the two gaps lands as part of the v1-launch wave (likely #80+).

## Next eligible

Per dependency check (v1 only):
- Task #56 (Entry-number canonicalization function) — deps `[55]` satisfied. **Eligible — lowest id.**
- Task #61 — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.
- Task #72 (admin dashboard scaffold) — eligible.
- Task #74 — eligible.

Lowest-id eligible is **task #56** — pure-function entry-number canonicalization (whitespace strip, separator normalization, CBP format validation).

## Notes

- 55/86 v1 done — past 60% of Phase 0.
- Wave 8 (Recovery context) checkpointed.
- Loop will continue with #56 next iteration.
