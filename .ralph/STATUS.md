# Ralph Loop Status

**Updated**: 2026-04-21T08:42:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 28 → 29)

## Counts

| Status | Count |
| --- | --- |
| completed | 28 |
| in-progress | 0 |
| pending | 58 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 49 files, 283 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 16 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#31 — Lifecycle templates 4–9**

Six new React Email templates, each wrapping `EmailLayout` so the canonical "Not legal advice" disclosure rides on every send.

- `RecoveryPurchasedEmail` (#4) — welcome + first task framing.
- `RecoveryMissingDocsEmail` (#5) — 96h check-in with a 15-minute call offer.
- `EntryListReadyEmail` (#6) — restrained celebration + entry count + Prep next step.
- `PrepReadyEmail` (#7) — Readiness Report delivered + Concierge upsell secondary link.
- `ConciergeUpsellEmail` (#8) — at-the-moment-of-need framing with the success-fee mechanic spelled out.
- `ReengagementEmail` (#9) — day-14 soft re-entry; "we don't auto-renew anything; the case stays in your account either way."

Shared editorial primitives extracted to `templates/_components.tsx` (`H1`, `P` with size/muted variants, `PrimaryCta` ink-on-paper button, `SecondaryLink` accent-underlined, `greetingFor` helper) so the templates stay short and consistent.

6 new render-snapshot tests RED-then-GREEN.

## Workflows that publish these emails

The templates are ready when their publishing workflows land:

- `recovery-purchased` workflow → fires on the Stripe webhook (task #33) for Recovery SKUs.
- `recovery-missing-docs` cadence → 96h after recovery purchase, no documents (Phase-1 ops scaling).
- `entry-list-ready` → fires when an analyst marks the entry list ready (task #41 case state machine + the recovery context).
- `prep-ready` → fires on validator sign-off (task #65).
- `concierge-upsell` → fires when prep is ready and Concierge isn't already active.
- `re-engagement` → day-14 stalled-case sweep (Phase-1 ops scaling).

## Next eligible

Per dependency check:
- Task #32 (USER-TEST: Lifecycle emails reviewed) — deps `[28, 29, 30, 31]`. Task #30 is task-blocked on #51, so #32 is task-blocked too.
- Task #33 (Stripe SDK + webhook handler) — deps `[2]` satisfied. Eligible.
- Task #34 (pricing.ts) — deps `[1]` satisfied. Eligible.
- Task #39 (cases + audit_log schema) — deps `[2]` satisfied. Eligible.

Lowest-id eligible is **task #33** — Wave 6 (Stripe + pricing) begins next iteration.

## Notes

- Wave 5 (Lifecycle email + Inngest) 4/5 done; #30 + #32 blocked on #51.
- Loop will pivot to Wave 6 (Stripe + pricing) next iteration with task #33.
