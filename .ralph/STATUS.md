# Ralph Loop Status

**Updated**: 2026-04-21T09:43:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 34 → 35)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 34 |
| in-progress | 0 |
| pending | 52 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 59 files, 393 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 19 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#16 — `/pricing` page**

- Stage-by-stage editorial ladder per PRD 05 + PRD 06. Three stages (00 free screener, 01 recovery, 02 prep) + Concierge as a separate region + Monitoring at the bottom.
- Every figure rendered straight from `PRICE_LADDER` / `SUCCESS_FEE_RATES` / `SUCCESS_FEE_HARD_CAP` — no hand-typed numbers. An `it.each` table-test against `priceFor(sku, tier)` keeps that property honest.
- Concierge section discloses the success-fee mechanic in plain text: SMB 10–12%, mid-market 8–10%, $50,000 per-case cap, against the *realized refund* (not the estimate).
- `data-sku` per row + `data-price-mono` on figure cells for deterministic test resolution. Hairline rules between stages, mono numerics in the Berkeley Mono fallback chain, no popular badges, no contact-sales CTAs, free tier rendered with the same weight as paid.
- Added to the footer-presence integration test (`tests/integration/marketing/footer-presence.test.tsx`) so the canonical "Not legal advice" disclosure is asserted via the marketing layout.
- Playwright spec under `tests/e2e/anonymous/pricing.spec.ts`.

## Human-verification still owes

- Eyeball /pricing in a browser at the licensed-fonts-installed staging build; confirm the Berkeley Mono fallback doesn't produce visual jitter on the figure column.
- Lighthouse a11y / SEO / perf score ≥95 on staging deploy.

## Next eligible

Per dependency check (v1 only):
- Task #19 (USER-TEST: Marketing site live at staging) — deps `[14, 15, 16, 17, 18]` now satisfied. **Eligible — lowest id.** Will be marked `human-blocked` (genuine human walkthrough on staging deploy).
- Task #40 (XState case machine) — deps satisfied.
- Task #44 (documents + recovery_sources schema) — deps satisfied.
- Task #49 (recovery routing — broker vs DIY) — deps satisfied.
- Task #67 (CAPE prep workflow scaffold) — deps satisfied.

Lowest-id eligible is **task #19**.

## Notes

- Wave 3 (Marketing site) is now content-complete: home / how-it-works / pricing / trust / sub-processors / disclosure. Task #19 is the human checkpoint for it.
- Loop will pick #19 next iteration. Per loop protocol: a USER-TEST task gets marked `human-blocked` with scaffolding ready (the pages are real and tested) so the human walkthrough is the only remaining work.
