# Design Language

This document codifies the aesthetic direction for every surface we ship: marketing site, customer app, ops console, transactional email, even error pages and PDF readiness reports. It is the **taste contract** the product must honor.

If a designer or engineer is about to ship a screen and cannot point to a rule below that justifies their choice, the screen is wrong.

---

## The conceptual direction

> **Editorial-utilitarian.** *The Wall Street Journal* meets a customs broker's clipboard, with Stripe's restraint and a Bloomberg terminal's density.

We are not a friendly consumer SaaS. We are not a fintech. We are not another AI startup. We are the calm, literate, slightly serious operator the customer needs at exactly the moment they realize they may have left money with the federal government.

The customer is a CEO of a $5M ecommerce brand with thirty Slack messages open, a half-eaten lunch, and a vague memory that they paid duties through Flexport last year. Our job is to feel like the most competent professional that has ever walked into their inbox.

---

## Surface → skill mapping (binding)

Every UI surface gets a designated taste skill. Invoke `/taste-skill` at scaffolding time with the surface in mind; the table below names the right pick. **This document overrides the skill** wherever they conflict — see the "Skill rules we discard" column.

| Surface | Primary skill | Skill mode / archetype | Skill rules we keep | Skill rules we discard (because they conflict with this document) |
| --- | --- | --- | --- | --- |
| Marketing site (`/`, `/how-it-works`, `/pricing`, `/trust`, blog) | `minimalist-ui` | Premium Utilitarian Minimalism | Warm-monochrome canvas, editorial serif hero, generous macro-whitespace (py-24+), 1px `--rule` borders, no drop shadows, IntersectionObserver scroll-fade entry, accordions stripped to hairline-bottom dividers | **Their pastel accent palette** — replace with our single `--accent` customs-orange. **Their Playfair Display recommendation** — we use GT Sectra. **Their warm-grain ambient orb suggestion** — we use the static paper-grain noise overlay |
| Marketing hero only (within above) | + `high-end-visual-design`, *Editorial Luxury* vibe archetype | Editorial Luxury (warm cream, variable serif, paper noise overlay) | Massive variable-serif hero scale; paper-grain texture rationale; macro-whitespace doubling | **Vibe Glass / Soft Structuralism** — never. **Fluid Island nav** — banned. **Pill CTAs / magnetic button physics / button-in-button trailing icon** — banned. **Z-axis cascade / asymmetric bento with rotation** — banned. **Custom cubic-bezier bounce easings** — banned (use our 0.2,0.8,0.2,1) |
| Customer app: screener, recovery (customer view), prep (customer view), status banner, all authenticated marketing-adjacent surfaces | `minimalist-ui` | Premium Utilitarian Minimalism | The full Component Specifications: solid `#111111` CTA pattern (we re-skin to `--ink` / `--accent`), 1px hairline cards, generous internal padding, kbd-styled keystroke chips for shortcuts | Same overrides as marketing |
| Readiness Report PDF + engagement letter (artifact surface) | `minimalist-ui`, editorial-document mode | Editorial document | Macro-whitespace, editorial serif masthead, body sans, monochrome canvas, hairline rules between sections | Berkeley Mono mandatory for numbers/IDs/timestamps (skill endorses mono for code/keystrokes; we extend it to all numerics). Real footnote markup mandatory |
| Ops console: queue list, case workspace, doc viewer, validator UI, audit log viewer, admin views | `industrial-brutalist-ui`, **Swiss Industrial Print mode** | Swiss Industrial Print (light substrate `#F4F4F0` ≈ our paper, heavy sans, rigid CSS Grid, visible compartmentalization, `border-radius: 0`, bimodal density, monospace metadata) | Strict CSS Grid with `gap: 1px` over contrasting bg for hairline grid lines, zero `border-radius`, monospace dominance for IDs/timestamps/coords, `<dl>` / `<data>` / `<samp>` semantics, generous tracking for uppercase metadata | **Aviation Hazard Red `#E61919`** — we substitute our `--accent` customs-orange. **Tactical Telemetry dark mode** — light only at v1 (dark mode is a real designed mode but built on Swiss Industrial Print, not on phosphor green CRT). **CRT scanlines, halftone overlays, 1-bit dithering, ASCII brackets `[ ... ]`, viewport-bleeding numerals, registration/copyright marks as decoration, randomized "REV 2.6" / "UNIT D-01" strings** — all banned (theatrics that erode trust in a regulated product). **Heavy uppercase macro-typography at clamp(4rem, 10vw, 15rem)** — restrained to functional headings only |
| All UI work | + `full-output-enforcement` (paired) | n/a | Prevents truncated components and placeholder code in scaffolding | n/a |

### Why the conflicts are resolved this way

The three skills represent different aesthetic philosophies, and our product spans surfaces that legitimately want different treatment. But every override above traces to one of three principles in this document:

1. **Restraint signals competence.** This product is regulated and high-trust. Bouncy motion, theatrics (CRT scanlines, ASCII frames, hazard red, magnetic-physics buttons) actively undermine the trust we are trying to earn. Whenever a skill's spectacle conflicts with our restraint, restraint wins.
2. **Single accent.** We commit to one severe accent (customs-orange `--accent`). Skill palettes that introduce multiple pastels (`minimalist-ui`) or hazard red (`industrial-brutalist-ui`) get re-skinned to the single token.
3. **Editorial typography is the through-line.** GT Sectra display, Söhne body, Berkeley Mono numerics. Skill font recommendations (Playfair Display, Neue Haas Grotesk Black, Geist, Plus Jakarta Sans) are inputs to this commitment, not substitutes for it.

## Skill invocation (development workflow)

When scaffolding any new screen:

1. Identify which row of the surface mapping the screen falls under.
2. Run `/taste-skill <one-sentence-description-of-screen>`. The router picks the subskill; verify it matches the table above.
3. If the router picks differently, the table wins — invoke the table's pick directly via the Skill tool.
4. Always pair with `full-output-enforcement` for any non-trivial component.
5. Apply the **kept** rules from the skill plus the **overrides** from this document. When in doubt, this document wins.
6. Cite the chosen skill + override list in the PR description so the design-language gate review can verify.



### What this rules out

- Purple gradients. Indigo gradients. Any gradient that says "AI."
- The Linear / Vercel / Cal.com aesthetic clones.
- The "happy little illustrations of cargo ships" aesthetic.
- Friendly emoji in the product UI.
- Inter, Roboto, Arial, system-ui as a primary face.
- Round, soft, bouncy button motion.
- "AI sparkle" glyphs anywhere near a refund estimate.

### What this commits us to

- Editorial typography hierarchy.
- A muted, ink-on-paper palette with one severe accent.
- Tabular discipline — columns line up; numbers are tabular-figures.
- Restrained, deliberate motion.
- Density when it serves the user (ops console, entry tables); generous space when it builds confidence (screener, results).

---

## Typography

### Faces

| Role | Face | Why |
| --- | --- | --- |
| Display / editorial headline | **GT Sectra** *(or fallback: Tiempos Headline)* | Sharp serif with a contemporary cut — feels like a serious masthead, not a wedding invitation. |
| Body sans / UI | **Söhne** *(or fallback: Neue Haas Grotesk)* | Swiss-grade neutrality without the AI-startup cliché of Inter. |
| Tabular / mono | **Berkeley Mono** *(or fallback: JetBrains Mono)* | For entry numbers, duty values, and the ops console's data dense surfaces. |

We license the primary set; fallbacks ship as the load-failure path. The site never renders in a system font.

### Hierarchy rules

- Display sizes use **GT Sectra**, tracked tight, with deliberate widow control.
- Body text uses **Söhne** at 17px on marketing, 15px in app, 14px in ops.
- Numbers — refund amounts, entry counts, percentages — always render in **Berkeley Mono**, tabular figures, never in the body face.
- Long paragraphs in marketing use a **measure of 64–72ch** for readability. We do not let paragraphs run to the edge.
- All caps reserved for labels, never for headlines.

### Marketing voice in type

The headline on the homepage is set in GT Sectra at a size that feels like a magazine cover, not a SaaS hero. Subheads are sentence-case. Pull-quotes use a hairline rule above them, like a print article. Footnotes are real footnotes, with superscripted markers.

---

## Color

We commit to **ink-on-paper** with a single severe accent. The palette is restrained on purpose — restraint *is* the signal.

| Token | Value (light) | Value (dark) | Use |
| --- | --- | --- | --- |
| `--ink` | `#0E0E0C` | `#F4F1EA` | Primary text, primary marks |
| `--paper` | `#F4F1EA` | `#0E0E0C` | Page background |
| `--paper-2` | `#ECE7DC` | `#1A1A18` | Cards, inset surfaces |
| `--rule` | `#1F1F1B` @ 12% | `#F4F1EA` @ 16% | Hairlines, dividers |
| `--accent` | `#B8431B` *(customs orange)* | `#D4612F` | Single severe accent — CTA, high-importance state |
| `--accent-ink` | `#3B1606` | `#F4F1EA` | Foreground on accent fills |
| `--positive` | `#1F5641` *(deep filing green)* | `#3F8B6B` | Validated / submission-ready states |
| `--warning` | `#A57A1F` | `#D6A852` | Action-required state |
| `--blocking` | `#7A1F1F` | `#C25555` | Blocking errors, deficient states |

**Hard rules:**
- Never more than one `--accent` element above the fold.
- `--positive`, `--warning`, `--blocking` never appear on marketing — they are app-only state colors.
- No gradient fills. Ever. Tone shifts come from layered transparency on `--paper-2`, not from color stops.
- Dark mode is a real, designed mode — not a CSS invert.

---

## Spatial composition

### Marketing surfaces

- Built on a **12-column editorial grid** with a wide outer margin and a centered text column.
- Asymmetric — heroes anchor left or right, not centered.
- Hairline rules (`1px solid var(--rule)`) divide sections in place of color blocks.
- Marginalia: short callouts and footnotes can sit in the outer margin like a print article.
- One full-bleed photographic moment per page, max — high-contrast, documentary.

### App surfaces (customer)

- Dense but generous: forms breathe; data tables do not.
- Single-column for transactional flows (screener, upload, results) — no sidebar distractions.
- The **status banner** (current case state, next action) anchors the top of every authenticated page and never moves.

### Ops console

- Maximum density, zero apology. Tables, filters, side-by-side document-and-form layouts.
- Three-pane layouts: queue list / current case / inspector.
- Keyboard-first: every action has a shortcut; the visible UI is for new staff.
- Berkeley Mono everywhere a number, ID, or timestamp appears.

---

## Motion

- **Restrained.** State transitions are crisp and informational, not playful.
- Default easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (custom — feels like paper settling, not a spring).
- Default duration: **160ms** for state, **240ms** for surface, **480ms** for once-per-page hero reveals.
- No bounce. No overshoot. No physics springs on UI.
- Page-load orchestration: one well-staggered reveal per landing page, never per app screen.
- Hover states change weight or rule, not scale — buttons do not grow.
- The CTA on the homepage has exactly one micro-interaction: the underline rule extends on hover, like a magazine link.

---

## Backgrounds and texture

- The default canvas is `--paper`, not pure white. The cream warmth is the brand's calm.
- Full-bleed backgrounds use a **subtle paper-grain noise overlay** at 6% opacity — invisible until you remove it, then the screen feels sterile.
- Cards have **sharp corners** (4px max) and a **single hairline border**, not soft drop shadows.
- Section dividers are 1px hairlines with a 24px label sitting on the rule, like a chapter break.

---

## Iconography

- **Stroke-only** icons, 1.5px, square caps. No filled glyphs.
- Custom icon set, not Heroicons or Lucide defaults — those are recognized as AI-startup defaults.
- Status icons (validated / warning / blocking) are typographic marks, not pictograms: a checkmark, a triangle, a bar — set in the accent face.

---

## Components — the trust-bearing patterns

### The status banner (every authenticated screen)

A single-row band at the top of the page:

```
┌────────────────────────────────────────────────────────────────────┐
│  CASE 2026-04-1138        STATUS  ENTRY LIST READY                 │
│                           NEXT    Review your entry list →         │
└────────────────────────────────────────────────────────────────────┘
```

- Case ID in mono, prefixed with the date (so it is human-memorable).
- Status label set in the accent or status color.
- Next action is a real link, not a button — emphasizes self-direction.
- Banner is never collapsible. It is the spine.

### The readiness report

The PDF/email artifact a customer receives at the end of CAPE Prep. Designed like a one-page editorial dossier:

- Masthead-style header with case ID and date.
- A single hero metric: "**N entries validated. K blocking issues. Submission readiness: READY / NOT YET.**"
- A typeset table of entries with status glyphs.
- A signed footer with the reviewing analyst's name and timestamp.
- Footnotes for caveats, in real footnote style.

This artifact is the product's most photographable surface. It must look like something a CFO would forward to their board without changing a pixel.

### The screener

Designed like the IRS form they wish existed.

- One question per screen.
- The question is set in **GT Sectra** at display size — it feels significant.
- The answer area uses generous spacing; no progress bar (the count of remaining questions is shown as small print top-right).
- Branching is invisible — the customer never sees the logic, only the next relevant question.
- Final screen is a confirmation, not a conversion CTA.

### The CTA pattern

There is one canonical CTA in the product:

- A **horizontal rule of accent color** under sentence-cased text, with a chevron.
- It animates as a magazine-style underline extending on hover.
- Filled accent buttons are reserved for **once per screen** moments (purchase, sign).

---

## Photography and imagery

- No stock photography of cargo ships, port cranes, or "diverse business teams in front of laptops."
- If we use imagery, it is documentary: a real CBP form, a real customs invoice (anonymized), a real ACE export view. Black-and-white preferred.
- Marketing illustrations are line drawings in the body sans face's stroke weight — never colorful, never cartoonish.

---

## What "good" looks like (reference points, not to copy)

- *The Browser* (newsletter typography).
- *Stripe Press* book site (editorial restraint, mono accents).
- *Are.na* (paper warmth, calm density).
- *FT Alphaville* (information density that respects the reader).
- The actual CBP CAPE specification PDF (typographic earnestness).

What "bad" looks like:
- Linear, Vercel, Cal.com, every YC W24 launch site.
- Anything described as "modern, clean, and minimal" in a generic stock-design pitch.
- Any product where the homepage reads "Powered by AI."

---

## Process — how taste enters the build

1. **Every PRD includes a "Design notes" section** that names the screens and their aesthetic intent.
2. **Every UI PR includes a screenshot** in the description, plus a one-sentence "what is this screen *trying* to feel like?"
3. **A design taste review** runs before merging any new customer-facing surface — checks against this document, not against personal preference.
4. **`/frontend-design` is invoked** when scaffolding any new screen — it is part of the development pipeline alongside `/coder` and `/judge`.
5. **No screen ships in a system font, in default Tailwind colors, or with a generic shadcn button style.** Components are themed before first render.

---

## In one line

> If a screen would not look out of place pinned next to a *Stripe Press* book and a CBP form on a serious operator's desk, it is wrong.
