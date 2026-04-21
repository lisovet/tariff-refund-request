# PRD 01 — Eligibility Screener

## Purpose

Qualify a lead in under three minutes, route them to the correct recovery path, and produce a credible refund estimate that motivates the next paid step. This is the top of the entire funnel — it is also the first time a customer experiences our taste, restraint, and competence.

## User journey

```
Marketing CTA
  │
  ▼
Screener Q1 (one question per screen, GT Sectra display)
  │  branching, hidden from user
  ▼
Q2 → Q3 → ... → Q10
  │
  ▼
Email capture (final step, framed as "where should we send your results")
  │
  ▼
Results page  ──► Paid Recovery checkout
              └► Disqualified state (with respectful exit + opt-in for updates)
```

## Screens

### Screener question screen

- One question per screen.
- Question set in **GT Sectra display**, ~48px on desktop, 32px on mobile.
- Answer area beneath in **Söhne** body, generous spacing.
- Top-right: small mono indicator `Q3 / 10`.
- Bottom-left: `← Previous` as a link.
- No progress bar, no celebrations, no emoji.
- One CTA: `Continue →` underlined accent rule, magazine style.

### Email capture screen

Framed as: *"Where should we send your results?"* (not "sign up", not "create account"). Single email field. Privacy line beneath: *"We never sell or share your information. Read our trust posture →"*.

### Results screen

Anchored by a single editorial dossier:

- **Hero metric**: estimated refund range, set in Berkeley Mono at 64px. e.g. `$18,400 — $46,200`.
- **Confidence label**: `HIGH` / `MODERATE` / `LOW`, set in accent.
- **Qualification status**: a one-sentence editorial verdict.
- **Filing readiness status**: prerequisites met / missing (ACE, ACH, IOR, liquidation status).
- **Next step**: a single CTA to the right paid product, sized for confidence not aggression.
- **Disqualified variant**: a respectful explanation, "we'll let you know if your situation changes," opt-in to future updates.

## Branching question set (v1)

| # | Question | Branches |
| --- | --- | --- |
| 1 | Did you import goods into the U.S. between [start] and [end]? | No → DQ-1 |
| 2 | Where were the goods primarily manufactured? | Country → continues; "I don't know" → flag, continue |
| 3 | Are you the Importer of Record on these shipments? | No → DQ-2 (referral / education) |
| 4 | Who handled customs clearance? | Broker / Carrier (DHL/FedEx/UPS) / Self-filed via ACE / Mixed |
| 5 | Approximately how many import shipments did you make? | <5 / 5–50 / 50–500 / 500+ |
| 6 | Approximately how much did you pay in duties total? | bands → drives refund estimate |
| 7 | What categories of goods? | multi-select; flags HTS exposure |
| 8 | Have your entries been liquidated? | Yes / No / Don't know — affects readiness |
| 9 | Do you have an ACE portal account? | Yes / No / Don't know — drives recovery routing |
| 10 | Company name + work email | required to deliver results |

Branching is invisible to the user. Logic lives in `src/contexts/screener/branching.ts` and is fully unit-tested.

## Routing decision (output)

The screener outputs a typed `ScreenerResult`:

```ts
{
  qualification: 'qualified' | 'likely_qualified' | 'disqualified',
  refundEstimate: { low: USD, high: USD } | null,
  confidence: 'high' | 'moderate' | 'low',
  recoveryPath: 'broker' | 'carrier' | 'ace-self-export' | 'mixed' | null,
  prerequisites: { ace: boolean, ach: boolean, ior: boolean, liquidationKnown: boolean },
  recommendedNextStep: 'recovery_kit' | 'recovery_service' | 'cape_prep' | 'concierge' | 'none',
  disqualificationReason?: 'not_ior' | 'no_imports_in_window' | 'unknown',
}
```

This object — not the UI — is the source of truth. The results page renders it; the recovery context consumes it; ops staff see the same structure in the console.

## Acceptance criteria (Given/When/Then)

- **Given** a user lands on the screener,
  **When** they answer Q1 with "No,"
  **Then** they reach a respectful disqualification screen within one transition and a record is created with `disqualificationReason = 'no_imports_in_window'`.
- **Given** a user qualifies and indicates broker-handled clearance,
  **When** they reach the results page,
  **Then** `recoveryPath = 'broker'` and the recommended next step links to the Recovery Kit checkout (broker variant).
- **Given** a user indicates "I don't know" for ACE,
  **When** results render,
  **Then** the prerequisites section calls out `ACE: unknown — we'll help you check` and links to a one-page explainer.
- **Given** an incomplete screener session,
  **When** the user returns within 7 days using the same email,
  **Then** they resume at the next unanswered question.
- **Given** a refund estimate is shown,
  **Then** it always renders with a confidence label and a "this is an estimate" footnote in real footnote style.

## Edge case inventory (12-pass hardening, top items)

- User refuses email capture → results visible in-session only, no persistence.
- User answers Q6 with the lowest band → estimate may be below the cost of paid recovery; surface a transparent "may not be worth it" banner.
- User triggers branching contradictions (e.g., not IOR but answers Q5 as 500+) → flag for human triage, still produce results.
- Mid-screener tab close → next-load resumes; if email already captured, also recoverable via emailed magic link.
- Bot/spam submissions → Cloudflare Turnstile gate before email send, not before screener entry.
- Multi-language users → English only at v1; clear "English-only" notice in footer.
- A11y: every question is reachable by keyboard alone; question text is the page `<h1>`; status-color is never the only signal.
- Slow / flaky network → answers persisted client-side and synced on reconnect; no lost progress.
- Estimate calculation drift → estimator function versioned (`estimator@v1`); each result records its version.
- Privacy / GDPR — pre-results, retention is 30 days; post-results, treated as customer data.
- Embedded screener (partner sites in Phase 3) — same logic, themable surface.
- Disqualified-then-eligible flip — if rules change, re-engage via opt-in list, not by re-running their old answers silently.

## Data model touchpoints

- `screener_sessions` (id, started_at, answers jsonb, completed_at, result jsonb, version)
- `leads` (id, email, company, screener_session_id, created_at, source)

## Design notes (taste lens applied)

- The screener is the customer's first encounter with us. It must feel like the *form a competent professional designed*, not a SaaS funnel.
- GT Sectra display sets the tone: this is a serious, considered question.
- No progress bar — replaced with a small mono `Q3 / 10`. A bar implies a transactional sprint; this is consultative.
- The results dossier is photographable. A founder should want to screenshot it.

## Out of scope (this PRD)

- Multi-language.
- Embedded / partner-themed variants.
- Account creation (handled by Clerk magic link off the email-capture step).
- Refund-estimate model retraining (versioned constant in v1).
