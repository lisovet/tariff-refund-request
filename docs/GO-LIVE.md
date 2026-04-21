# Go-live checklist

**Goal:** take the code that ships on `main` (lisovet/tariff-refund-request) and turn it into a live product at a real domain, taking real customers.

Each section is a hard gate — do not move past it until the "verify" step passes on staging. Expect ~2 days of elapsed work, not coding time.

---

## 0. Pre-flight (30 min)

- [x] **Production domain:** `tariffrefundrequest.com`. Confirm the registrar login + that DNS is controllable from there.
- [ ] Pick the governing-law state for the engagement letter (currently defaults to Delaware in the Concierge letter). Decide: Delaware, California, or your incorporation state.
- [ ] Confirm the legal entity name that appears in the engagement letter (currently `Takemaya Software, Inc.`).
- [ ] **Sending email:** `noreply@tariffrefundrequest.com` (or `hello@tariffrefundrequest.com` if marketing-forward).
- [ ] **Verify:** the entity name + sending email are written down somewhere you won't lose them (1Password / Notion).

---

## 1. Railway — hosting + Postgres (1 hour)

- [ ] Create a Railway account if you don't have one.
- [ ] New project → "Deploy from GitHub repo" → pick `lisovet/tariff-refund-request`.
- [ ] Add a **Postgres** service to the same project. Railway auto-generates a `DATABASE_URL` variable reference; wire it to the app service as an env var.
- [ ] Create two environments under the project: `production` and `staging`. Each gets its own Postgres instance.
- [ ] Set the build command: `npm run build`. Start command: `npm start`. Node version: 20.
- [ ] In the **staging** environment variables, paste every env var from `.env.example` and fill with staging values.
- [ ] **Verify:** staging URL loads the marketing homepage with no console errors.

---

## 2. Database migrations (15 min)

- [ ] Locally: `DATABASE_URL=<railway-staging-url> npm run db:migrate`. Watch the 8 migrations (0000–0007) run in order.
- [ ] Check via `DATABASE_URL=<…> npm run db:studio` that every table exists: `customers`, `staff_users`, `screener_sessions`, `leads`, `processed_stripe_events`, `payments`, `cases`, `audit_log`, `documents`, `recovery_sources`, `entries`, `entry_source_records`, `batches`, `batch_entries`.
- [ ] Repeat for production once staging is fully verified.
- [ ] **Verify:** `SELECT COUNT(*) FROM cases;` returns `0` on a fresh migration — no surprises.

---

## 3. Clerk — authentication (45 min)

- [ ] Create a production Clerk app at dashboard.clerk.com.
- [ ] Enable: Email + passkey, SSO (Google + Microsoft), Magic link.
- [ ] Create a Clerk **organization** for staff. Require MFA on the organization (Settings → Security → Multi-factor → Require for all members).
- [ ] In the staff org, define four roles matching the code: `coordinator`, `analyst`, `validator`, `admin`.
- [ ] Register the Clerk webhook endpoint: `https://staging.tariffrefundrequest.com/api/webhooks/clerk`. Copy the svix signing secret.
- [ ] Set env vars (staging AND prod): `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` (the `NEXT_PUBLIC_*` prefix if your code uses it), `CLERK_WEBHOOK_SECRET`.
- [ ] Invite yourself to the staff org as `admin`.
- [ ] **Verify:** `/ops` redirects an unauthenticated visitor to `/sign-in`, and after signing in as admin you land on the queue page.

---

## 4. Cloudflare R2 — document + artifact storage (20 min)

- [ ] Create `tariff-refund-prod` and `tariff-refund-staging` buckets on Cloudflare R2.
- [ ] Issue one Access Key ID + Secret per environment. Scope to bucket-only, not account.
- [ ] Set env vars: `STORAGE_DRIVER=s3`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` (e.g., `https://<account>.r2.cloudflarestorage.com`), `R2_BUCKET`, `R2_REGION=auto`.
- [ ] **Verify:** from a staging Inngest worker or a temporary route, call `storage.putObject('cases/cas_smoke/doc_smoke/test.txt', Buffer.from('hi'))` then `storage.getSignedReadUrl(...)` and open the URL. Should download `hi`. Delete it.

---

## 5. Stripe — billing (45 min)

- [ ] Enable **Live Mode** on your Stripe account. Enable **automatic tax** (Dashboard → Settings → Tax).
- [ ] Locally: `STRIPE_SECRET_KEY=<live-key> npm run stripe:sync` — creates every product + price with lookup_keys `trr__<sku>__<tier>`. Run once against Test Mode first, then Live.
- [ ] Register the webhook `https://tariffrefundrequest.com/api/webhooks/stripe` for events: `checkout.session.completed`, `charge.refunded`, `invoice.payment_failed`, `invoice.payment_succeeded`. Copy the signing secret.
- [ ] Set env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`.
- [ ] **Verify:** `stripe trigger checkout.session.completed` from the Stripe CLI delivers to staging; `SELECT * FROM processed_stripe_events` shows the event id + `ON CONFLICT DO NOTHING` dedup works on a second trigger.

---

## 6. Resend — email (30 min)

- [ ] Create a Resend account. Add your sending domain (`tariffrefundrequest.com`).
- [ ] Publish the DNS records Resend gives you: **SPF**, **DKIM** (3 CNAMEs), **DMARC** (`v=DMARC1; p=quarantine; rua=mailto:postmaster@tariffrefundrequest.com`).
- [ ] Create an API key scoped to "sending only".
- [ ] Set env vars: `RESEND_API_KEY`, `EMAIL_FROM=noreply@tariffrefundrequest.com`.
- [ ] **Verify:** trigger a staging screener submission → receive the `ScreenerResultsEmail` in a real inbox with no spam-folder placement, DKIM + SPF both pass, DMARC aligned.

---

## 7. Inngest — durable workflows (20 min)

- [ ] Create an Inngest account + a production + staging environment.
- [ ] Register the serve endpoint: `https://staging.tariffrefundrequest.com/api/inngest`. Inngest auto-discovers the workflows registered in `src/shared/infra/inngest/workflows/index.ts`.
- [ ] Confirm these 12 workflows appear in the Inngest dashboard:
  - `smoke-hello-world`
  - `screener-completed`
  - `screener-nudge-cadence`
  - `audit-log-mirror`
  - `stalled-cadence`
  - `artifact-generation`
  - `concierge-checkout-on-signed`
  - `funnel-screener-completed`
  - `funnel-payment-completed`
  - `funnel-concierge-signed`
  - `funnel-batch-signed-off`
  - `funnel-case-state-transitioned`
- [ ] Set env vars: `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`.
- [ ] **Verify:** complete a screener on staging → Inngest dashboard shows `platform/screener.completed` delivered + two function invocations (`screener-completed` sends email; `funnel-screener-completed` logs to Axiom).

---

## 8. Sentry — error tracking (10 min)

- [ ] Create a Sentry project (Next.js template).
- [ ] Set env var: `SENTRY_DSN`.
- [ ] Create an alert rule: "Issues occurring in the last hour on /api/webhooks/*" → email the oncall address.
- [ ] **Verify:** throw a test error from a staging route → Sentry shows it within 60 seconds.

---

## 9. Axiom — structured logs + funnel dashboard (20 min)

- [ ] Create an Axiom dataset (e.g., `tariff-refund-prod`).
- [ ] Create an API token scoped to that dataset.
- [ ] Set env vars: `AXIOM_TOKEN`, `AXIOM_DATASET`.
- [ ] Import the starter dashboard with these four panels (queries run via APL):
  - **Screener completion rate** — `["<dataset>"] | where funnel == true and kind == "screener.completed" | summarize count() by bin(_time, 1d)`
  - **Qualified → recovery purchased conversion** — ratio of `recovery.purchased` over `screener.qualified` per day
  - **First-pass QA success** — ratio of `batch.signed_off` over attempts (pending: will need extra kind `batch.signoff_attempt` if granular — current v1 only emits successes)
  - **Time per case stage** — `state_transitioned` events grouped by `from`+`to` with mean dwell time
- [ ] **Verify:** complete a staging screener → Axiom shows `funnel:screener.completed` row with `funnel=true` tag within 60 seconds.

---

## 10. E-sign provider — Concierge engagement letter (1 hour)

**This is the biggest open item.** No provider is wired — `src/contexts/billing/e-sign/in-memory-provider.ts` is the test seam, not a real adapter.

- [ ] Pick a provider: DocuSign, HelloSign (Dropbox Sign), BoldSign, or PandaDoc. BoldSign has the simplest API and generous free tier for v1 volumes.
- [ ] Create an account + a developer API key.
- [ ] Implement `src/contexts/billing/e-sign/<provider>-provider.ts` conforming to the `ESignProvider` contract in `types.ts`. Two methods: `requestSignature` + `verifyWebhook`.
- [ ] Register the completion webhook at the provider: `https://tariffrefundrequest.com/api/webhooks/e-sign`.
- [ ] Wire a Next route handler at `src/app/api/webhooks/e-sign/route.ts` that calls `provider.verifyWebhook()` then `handleSignatureCompleted()` from `@contexts/billing`.
- [ ] Set env vars: `ESIGN_PROVIDER=<name>`, `ESIGN_API_KEY`, `ESIGN_WEBHOOK_SECRET`.
- [ ] **Verify:** send yourself an engagement letter from staging → sign it → Inngest dashboard shows `platform/concierge.signed` delivered + `concierge-checkout-on-signed` workflow opens a Stripe Checkout session → the session URL lands in your email via the lifecycle cadence (lands with the purchase flow; v1 just creates the session).

---

## 11. Custom fonts (30 min)

- [ ] Purchase licenses (or use the fallback chain). Options:
  - GT Sectra — Grilli Type ($$)
  - Söhne — Klim Type Foundry ($$)
  - Berkeley Mono — U.S. Graphics Company (one-time)
- [ ] Drop the `.woff2` files into `public/fonts/` for the web app.
- [ ] For the Readiness Report PDF: drop `.ttf` copies into `public/fonts/` and wire them into `src/contexts/cape/report-pdf/fonts.ts` via `Font.register({ family: 'ReadinessDisplay', src: 'public/fonts/GTSectra-Bold.ttf' })` etc. Remove the Times / Helvetica / Courier fallback placeholders.
- [ ] **Verify:** `npm run report:sample` produces a PDF; open `tmp/readiness-report-sample.pdf` and confirm the masthead uses the real fonts.

---

## 12. Domain + SSL (30 min)

- [ ] In Railway → production service → Settings → Custom Domain → add `tariffrefundrequest.com` + `www.tariffrefundrequest.com`.
- [ ] Update DNS at your registrar: CNAME `www` → `<project>.up.railway.app`; ALIAS/ANAME apex → Railway's target.
- [ ] Let Railway auto-issue the Let's Encrypt cert (usually <2 min).
- [ ] **Verify:** `https://tariffrefundrequest.com` loads the marketing homepage with a valid certificate and no mixed-content warnings.

---

## 13. Launch gates — legal + content (variable)

- [ ] **Lawyer review** of `src/contexts/billing/agreements/concierge-v1.md`. Specifically the AAA arbitration clause (§8), governing law (§9), success-fee mechanic (§5). Get written sign-off before the first real Concierge purchase.
- [ ] **Lawyer review** of `src/contexts/billing/agreements/recovery-prep-v1.md` — the clickwrap for Recovery / CAPE-Prep purchases.
- [ ] **Founder + design reviewer** open `tmp/readiness-report-sample.pdf` (after step 11) and confirm the "CFO would forward this unchanged" bar per task #71.
- [ ] **Founder + outside reviewer** read `/trust`, `/trust/security`, `/trust/sub-processors` top-to-bottom per task #76. Outside reviewer should include a lawyer.

---

## 14. End-to-end staging smoke (1 hour)

Do every one of these against staging. Each is a gate.

- [ ] Anonymous walkthrough: `/`, `/how-it-works`, `/pricing`, `/trust`, `/trust/security`, `/trust/sub-processors`. No console errors. No broken images. Fonts render per step 11.
- [ ] Screener end-to-end: complete all questions → receive the `ScreenerResultsEmail` → click the magic link → `/screener/results` opens the dossier.
- [ ] Lifecycle nudges: ignore the email → after 24 hours the 24h nudge arrives; after 72 hours the 72h nudge arrives (or force them via Inngest's replay).
- [ ] Recovery purchase: click CTA → Stripe Checkout opens → pay with a test card (`4242 4242 4242 4242`) → `/api/webhooks/stripe` fires → case materializes → `RecoveryPurchased` email delivers.
- [ ] Concierge flow: request engagement letter → sign in the provider sandbox → `/api/webhooks/e-sign` fires → Stripe Checkout opens (not before signature) → pay → case transitions to `concierge_active`.
- [ ] Ops: sign in as staff → `/ops` loads the queue → claim a case → work it to `batch_qa` → run validator sign-off → artifact pipeline uploads CSV + PDF to R2 → `PrepReadyEmail` delivers with signed URLs.
- [ ] Data rights: as a customer, request export → receive the JSON with your identity + cases + audit entries. Request deletion → after 30 days (or force-run the worker) your records are purged and the audit log has the content-free `customer.deleted` row.
- [ ] Observability: every step above shows up in the Axiom funnel dataset; any errors show up in Sentry.

---

## 15. Production cutover (30 min)

- [ ] Copy every env var from staging → production Railway environment. Change the provider keys from test-mode/sandbox → live-mode where applicable (Stripe + e-sign).
- [ ] Change DNS to point the prod domain at the production Railway service.
- [ ] Run the 8 Drizzle migrations against the production DB (step 2 repeated).
- [ ] Run `npm run stripe:sync` against Stripe Live (step 5 repeated) so the production catalog exists.
- [ ] Do one more smoke walkthrough of step 14 items 1, 2, and 6 against production — at minimum marketing loads, screener works, ops can sign in.
- [ ] **Announce.** Send the first real lifecycle email to your pilot customers.

---

## What's not in scope for go-live

These are post-launch improvements, not blockers:

- **Phase-2 sub-processor notification** — the codebase bumps `SUB_PROCESSORS_LIST_VERSION` when the list changes; the lifecycle email that announces updates lands with Phase 1, not v1.
- **Task #401 — AI-assist marketing copy** — post-v1 growth work across 8 funnel surfaces.
- **OCR / AI extraction (PRD 08)** — Phase 2.
- **Partner motion (PRD 09)** — Phase 3.
- **Full admin console** — staff management, audit log export, etc. is partially covered by the v1 ops console; the enterprise admin view is later.

---

## Owner roles (nice-to-have assignments)

If two or more people are doing the deploy, split like this:

- **Infra owner** — Railway, R2, DNS, domain (steps 1, 2, 4, 12)
- **Platform owner** — Clerk, Stripe, Resend, Inngest, Sentry, Axiom, e-sign (steps 3, 5, 6, 7, 8, 9, 10)
- **Content + legal owner** — fonts, lawyer review, copy sign-off (steps 11, 13)
- **QA owner** — the end-to-end smoke (step 14)

All four converge at step 15.
