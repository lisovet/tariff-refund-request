# Ralph Loop Status

**Updated**: 2026-04-21T08:56:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 30 → 31)

## Counts

| Status | Count |
| --- | --- |
| completed | 30 |
| in-progress | 0 |
| pending | 56 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 52 files, 319 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 17 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#34 — Pricing ladder in code (`pricing.ts`)**

- `PRICE_LADDER` — 6 SKUs × 2 tiers, all amounts in USD cents.
- `SUCCESS_FEE_RATES` — SMB `{ min: 0.10, max: 0.12 }`, mid-market `{ min: 0.08, max: 0.10 }`.
- `SUCCESS_FEE_HARD_CAP` — $50k per case (blanket dollar cap is the simplest defensible policy; raising it would be a deliberate ladder change).
- `determineTier({ entryCount, dutyAmountUsdCents })` — strict `>` thresholds (>100 entries OR >$50k duty → mid_market), so boundary cases land as SMB.
- `priceFor(sku, tier)` and `computeSuccessFeeCents({ refund, tier, rate? })` helpers. Rate clamped to tier band; result rounded to whole cents; zero on non-positive refund.
- Re-exported from `src/contexts/billing/index.ts` (UI-safe — pure helpers + types).
- 27 new tests including ladder-table coverage, tier boundary tests, rate-clamp behavior (low→min, high→max, default→min), $50k hard cap on a $1M refund, fractional-cent rounding, zero/negative refund handling.

## Human-verification still owes

- Review `SUCCESS_FEE_HARD_CAP` with founder/legal — $50k is a reasonable initial policy but worth confirming.

## Next eligible

Per dependency check:
- Task #35 (Stripe catalog sync script) — deps `[34]` now satisfied. Eligible.
- Task #39 (cases + audit_log schema) — deps `[2]` satisfied. Eligible.
- Task #16 (`/pricing` page) — deps `[14, 36]`; `#36` not yet done; still task-blocked.

Lowest-id eligible is **task #35** — Stripe catalog sync.

## Notes

- Wave 6 (Stripe + pricing) 2/5 done.
- Loop will continue with task #35 next iteration.
