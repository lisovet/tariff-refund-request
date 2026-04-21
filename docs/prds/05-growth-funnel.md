# PRD 05 — Growth Website & Conversion Funnel

## Purpose

Convert qualified traffic into screener completions and screener completions into paid recovery. The marketing site is the **first taste-test**. If it reads like a YC W24 launch, we have already lost.

## Audience

A founder or operations lead at an SMB importer. They Googled "did I overpay tariffs" or arrived from an agency / broker referral. They are skeptical, busy, and have heard a lot of refund pitches. They will trust restraint over hype.

## Information architecture

```
/                       Home (editorial hero, screener CTA)
/how-it-works           Three-stage explainer (recovery → prep → concierge)
/pricing                Stage-by-stage ladder
/recovery               Detail page on Entry Recovery
/cape-prep              Detail page on CAPE Filing Prep
/concierge              Detail page on Concierge
/trust                  Trust posture, "what we are not", disclosures
/for-agencies           Partner / agency entry point (Phase 1)
/blog                   Editorial publishing surface
/screener               The eligibility screener (PRD 01)
```

No "/features." No "/integrations." No "/use-cases." Those words sell SaaS — we sell competence.

## Homepage hierarchy

1. **Editorial hero** — GT Sectra display. *"You may be owed an IEEPA tariff refund."* Subhead in body sans: *"We help you find your entry numbers and prepare a CAPE-ready file."* One CTA: *Check eligibility →* (magazine-style underline).
2. **Proof statement** — One paragraph in serif, set like a print article opener. *"Built for importers, not trade experts. The first paid step costs $99."*
3. **Three-movement explainer** — Recovery / Prep / Concierge as three columns, each with a one-sentence summary and a numeric mono price.
4. **Anti-positioning section** — *"What we are not."* This is the trust signal. We tell them what we don't do (auto-file, give legal advice, finance refunds). Differentiates us from the field.
5. **Reference quote** — A real customer or partner pull-quote, set with hairline rule above, like a print article.
6. **Footer with trust posture link, status page, and the "not legal advice" disclosure in real footnote style.**

No carousel. No animated counters. No "Trusted by" logo wall (until we have logos worth showing). One photographable hero image, max — a high-contrast documentary photo of a real customs document.

## Funnel logic

```
Traffic source ──► Home / detail page ──► /screener
                                              │
                                              ▼
                                       Screener completed
                                              │
                                              ▼
                                       Results page (PRD 01)
                                              │
            ┌─────────────────────────────────┼──────────────────┐
            ▼                                 ▼                  ▼
     Buy Recovery Kit ($99)        Buy Recovery Service     Buy Filing Prep
                                      ($299)                 (rare direct)
            │                                 │                  │
            └──────────► Lifecycle nurture ◄──┘                  │
                              │                                  │
                              ▼                                  ▼
                       Re-engage if stalled            Concierge upsell path
```

## Lifecycle email sequence

Driven by Inngest, templates in Resend (per ADR 012).

| # | Trigger | Purpose |
| --- | --- | --- |
| 1 | Screener completed | Deliver results, framed as a dossier |
| 2 | 24h post-screener, no purchase | Soft nudge; explain why recovery comes first |
| 3 | 72h post-screener, no purchase | Founder-style email with the "what's actually hard" frame |
| 4 | Recovery purchased | Welcome, what to expect, first task |
| 5 | 96h post-recovery, no docs | Helpful follow-up + offer of a 15-min call |
| 6 | Entry list ready | Celebration in restraint; next step (Prep) |
| 7 | Prep ready | Readiness Report delivered; next step (self-file or Concierge) |
| 8 | Concierge upsell | At-the-moment-of-need pitch |
| 9 | Re-engagement | If stalled past day 14, soft re-entry |

Every email written like a personal note from a serious operator. No HTML banners. No "click here." Underlined accent-colored links inline.

## Pricing page

Organized by **workflow stage**, not SaaS plan tiers. Three columns: *Find out if you qualify* (free), *Recover your entries* ($99–499), *Prepare your file* ($199–999). Concierge sits below as a separate section because its pricing is bespoke + success fee.

Tabular figures only. No "Get a Quote." No "Contact Sales." Phone numbers and direct calendar links published openly.

## Trust modules (reusable components)

- **The "Not legal advice" footnote** — a real footnote pattern, not a banner.
- **The "We prepare files; you control submission" promise** — appears on /how-it-works, /cape-prep, /trust.
- **The "Human-reviewed outputs" promise** — names the role (validator) and the artifact (Readiness Report).
- **The "Secure upload portal" badge** — links to /trust security page with real specifics (R2, encryption, retention policy).
- **The "Start even if you don't know your entry numbers" reassurance** — the wedge restated.

## SEO posture

Editorial and durable. Long-form articles like *"How to find your entry numbers when your broker won't reply,"* *"The CAPE format, explained for non-trade-experts,"* *"What 'liquidation' actually means and why it matters for your refund."* Each article ends with a screener CTA.

We do not chase keyword volume. We chase intent.

## Acceptance criteria

- **Given** a visitor lands on `/`,
  **When** they reach the screener CTA,
  **Then** the page has loaded under 1.2s LCP and no script over 100kb has been served.
- **Given** a visitor scrolls the homepage,
  **When** they reach the *"What we are not"* section,
  **Then** the section is fully readable and the disclosures are real-text, not images.
- **Given** a visitor with JS disabled,
  **When** they reach the screener CTA,
  **Then** it routes to a server-rendered first question.
- **Given** a Lighthouse run on each marketing page,
  **Then** scores ≥95 across performance, accessibility, best-practices, SEO.
- **Given** a referral query parameter (`?ref=<partner>`),
  **When** the visitor completes the screener,
  **Then** the lead carries the referral source for attribution.

## Edge case inventory

- Visitor on a corporate proxy stripping cookies → screener works without analytics.
- Mobile portrait orientation only — no horizontal-scroll tables.
- Print stylesheet — pricing page should print cleanly (sales aid).
- High-contrast / dark-reader extensions — no broken color combos.
- Slow connection regions — full functionality on 3G.
- Localization — English only at v1; structured for future i18n.
- Search engine indexing — robots.txt allows public marketing, blocks `/app`, `/ops`, `/screener` flow pages after step 1.
- A11y — screen reader hierarchy via real h1/h2/h3, never via styled spans.
- Footer trust link must always exist on every page.
- Empty states for blog before launch — page deferred until 3 articles exist; do not ship a "Coming soon."

## Design notes (taste)

### Skills

- **Taste — sitewide**: `minimalist-ui` (Premium Utilitarian Minimalism). Invoke via `/taste-skill editorial marketing site for a customs-refund prep service — homepage, how-it-works, pricing, trust, blog`.
- **Taste — homepage hero only**: pair in `high-end-visual-design` *Editorial Luxury* vibe archetype for the masthead-style hero typography and paper-grain texture rationale. Invoke via `/taste-skill editorial luxury hero for a serious B2B refund prep service masthead`.
- **Pair with**: `full-output-enforcement` for every page — marketing components are long, must not truncate.
- **Other (copy)**: `copywriting-strategist` to brainstorm angles for the headline and anti-positioning section; `copywriting-formatter` to turn approved angles into finished copy (homepage, lifecycle templates, footnotes); `ad-validator` to stress-test the homepage and pricing copy before launch. (These are pipeline skills available in this install.)
- **Apply from `minimalist-ui`**: warm-monochrome paper canvas, generous macro-whitespace (py-32 on hero, py-24 elsewhere), 1px hairline section dividers, accordion items separated by hairline-bottom only, real footnotes, IntersectionObserver scroll-fade for section reveals, Phosphor (or equivalent) bold-weight icons for the few iconographic moments.
- **Apply from `high-end-visual-design` (hero only)**: massive variable-serif scale at clamp(4rem, 8vw, 8rem), warm-cream paper texture, paper-grain overlay (fixed pseudo-element, opacity 0.03–0.06), eyebrow-tag pattern for section labels.
- **Override from `docs/DESIGN-LANGUAGE.md` (binding, both skills)**: GT Sectra display (not Playfair, not Geist, not Clash); single `--accent` customs-orange (not pastel multi-accents, not hazard red); magazine-underline CTA pattern (not pill `rounded-full` CTAs, not button-in-button trailing icons); restrained 0.2,0.8,0.2,1 easing (not custom bounce cubic-beziers); **no** Fluid Island floating nav, **no** magnetic button physics, **no** Z-axis cascade rotations, **no** asymmetric bento with tilt — those are spectacle that erodes trust here.

### Aesthetic intent

- The homepage is the moment we either earn or lose taste credit. GT Sectra display, ink on paper, hairline rules, one accent.
- One full-bleed documentary photograph max — high-contrast, possibly black-and-white, of a real customs form or a port at dawn (we have a budget for this; do not stock).
- Footnotes are real superscript footnotes. The first time someone scrolls to one, they remember the site.
- No purple. No gradients. No isometric illustrations.
- The CTA underline animates as a magazine link. That is the only motion on the homepage.

## Out of scope

- Webinar / event funnel.
- Affiliate program automation (Phase 2).
- Spanish / French marketing pages.
- Investor / pitch landing.
