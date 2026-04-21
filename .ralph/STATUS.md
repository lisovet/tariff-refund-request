# Ralph Loop Status

**Updated**: 2026-04-21T10:55:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 46 → 47)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 46 |
| in-progress | 0 |
| pending | 40 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 72 files, 558 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 21 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#50 — Outreach kit templates (broker, carrier, ACE, mixed)**

- Templates promoted to versioned per-path files in `src/contexts/recovery/templates/`: `broker.ts`, `carrier.ts`, `ace.ts`, `mixed.ts`, plus shared `types.ts` (`OUTREACH_TEMPLATE_VERSION = "v1"`) and an `index.ts` registry.
- `renderOutreachKit(path, tokens)` substitutes every `{{placeholder}}` via a pure regex pass and returns `{ version, path, subject, body }`. Throws on a missing required placeholder so the customer never sees `{{brokerName}}` literals in their inbox.
- `routing.ts` now consumes the canonical templates via a small `planTemplate(path)` helper rather than duplicating wording inline — single source of truth.
- Cross-template invariants enforced by tests: every body `{{placeholder}}` is declared in `placeholders[]`; every declared placeholder is used at least once. Caught one orphan: the mixed template's body now references the date range so `windowStart`/`windowEnd` are not declared-but-unused.
- 4 frozen snapshots (one per path) + 25 new template tests. Routing snapshot for the mixed plan updated to reflect the deliberate copy change.

## Human-verification still owes

- Marketing / founder review of the four outreach copy variants — these go directly to the customer's broker/carrier inbox, so wording is high-stakes.
- Decide on a token formatter for `windowStart` / `windowEnd` (currently raw ISO YYYY-MM-DD; rendered email might want "April 1, 2024" formatting). v1 punts on this — caller can pre-format.

## Next eligible

Per dependency check (v1 only):
- Task #37 (Payment aggregate + success-fee invoicing) — deps `[33, 50]` now satisfied. **Eligible — lowest id.**
- Task #51 — eligible.
- Task #52 — eligible.
- Task #55 (entries schema) — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.

Lowest-id eligible is **task #37** — Payment aggregate + audit ledger + success-fee invoicing + refund clamp logic per PRD 06.

## Notes

- Wave 8 (Recovery context) — outreach templates landed. Wave 6 (Stripe + pricing) revisits with the Payment aggregate next.
- Loop will continue with #37 next iteration. Substantial scope (idempotent on Stripe event id, refund clamp logic, success-fee invoice creation).
