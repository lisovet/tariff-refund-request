# Ralph Loop Status

**Updated**: 2026-04-21T09:25:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 32 → 33)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 32 |
| in-progress | 0 |
| pending | 54 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 57 files, 360 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 18 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#36 — Checkout sessions for each SKU**

- `POST /api/checkout` opens a Stripe Checkout Session per (sku, tier).
- Pure `buildCheckoutSessionParams` in `checkout.ts`:
  - `mode=payment` for one-time SKUs, `mode=subscription` for monitoring.
  - `metadata.{screenerSessionId, sku, tier, app}` for webhook routing.
  - `subscription_data.metadata` mirror so the same context lands on the subscription object.
  - `success_url` / `cancel_url` templated against the request `Origin`.
  - `automatic_tax: { enabled: true }` per PRD 06; `allow_promotion_codes: true` for the discount-code edge.
- `buildIdempotencyKey` scoped to `(sku, tier, screenerSessionId)` — retries from the client never double-create.
- `createCheckoutForSku` resolves price by `lookup_key=trr__<sku>__<tier>` — never hardcodes Stripe price IDs. Throws a clear error pointing at `npm run stripe:sync` if the catalog is stale.
- Stripe-backed adapter (`createStripeCheckoutClient`) lives in `checkout-client.ts` (server-only).
- Route validates `sku/tier/screenerSessionId/customerEmail?` via Zod; 400 on bad body, 502 if Stripe returns no URL, 500 on catalog mismatch.
- Stripe `Checkout.SessionCreateParams` namespace doesn't resolve through TS 6's class+namespace merge of the SDK's re-exports; switched to `Parameters<Stripe['checkout']['sessions']['create']>[0]` inference — same shape, version-stable.

## Human-verification still owes

- Run `npm run stripe:sync` against real Stripe test-mode account, then exercise `/api/checkout` end-to-end: complete in test mode, observe webhook → `platform/payment.completed` published.
- Confirm Stripe Tax is configured for the test account (the route opts in via `automatic_tax: enabled`).

## Next eligible

Per dependency check (v1 only):
- Task #39 (cases + audit_log schema) — deps `[2]` satisfied. **Eligible — lowest id.**
- Task #49 (recovery routing — broker vs DIY) — deps satisfied.
- Task #67 (CAPE prep workflow scaffold) — deps satisfied.
- Task #72 (admin dashboard scaffold) — deps satisfied.

Lowest-id eligible is **task #39** — cases + audit_log schema.

## Notes

- Wave 6 (Stripe + pricing) 4/5 done. Task #37 (success-fee invoicing) is task-blocked on the case state (#39+).
- Loop will continue with task #39 next iteration.
