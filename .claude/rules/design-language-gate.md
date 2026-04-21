# Every customer-facing screen passes the design-language gate

`docs/DESIGN-LANGUAGE.md` is the binding visual contract. Before any UI screen merges, it must be reviewed against that document.

## Hard rules (cannot ship without)

- **Typography**: Display in GT Sectra (or licensed alternate); body in Söhne (or licensed alternate); numbers/IDs/timestamps in Berkeley Mono (tabular figures). No system fonts. No Inter, Roboto, Arial.
- **Color**: Ink-on-paper palette; one severe accent (`--accent`); state colors (`--positive`, `--warning`, `--blocking`) only in app surfaces.
- **No gradients.** Tone shifts come from layered transparency, never color stops.
- **Sharp corners (4px max), single hairline border on cards** — no soft drop-shadows.
- **Restrained motion**: 160ms state, 240ms surface, 480ms once-per-page hero. No bounces, no overshoot, no springs on UI.
- **Status banner anchored** at the top of every authenticated page.
- **One accent CTA above the fold** on marketing surfaces.
- **Numbers use Berkeley Mono with tabular figures**, not the body face.
- **Real footnotes** for caveats — not banners or accordions.
- **No emoji** in the product UI.

## Required PR practices

- Every UI PR description includes a screenshot.
- The PR description answers: "What is this screen *trying* to feel like?"
- The PR description names the **taste skill** chosen and lists which of its rules were applied vs overridden (per `docs/DESIGN-LANGUAGE.md` Surface → skill mapping table).
- A design taste review (against `docs/DESIGN-LANGUAGE.md`, not personal preference) runs before merge.
- For new screens, run `/taste-skill <description>` at scaffolding time — taste is part of the dev pipeline. Always pair with `/full-output-enforcement` to prevent truncated components.

## Skill selection (binding)

Per the Surface → skill mapping in `docs/DESIGN-LANGUAGE.md`:

- **Marketing site** → `minimalist-ui` (+ `high-end-visual-design` *Editorial Luxury* archetype for hero only).
- **Customer app** (screener, recovery customer view, prep customer view, status banner) → `minimalist-ui`.
- **Readiness Report PDF + engagement letter** → `minimalist-ui` editorial-document mode.
- **Ops console** (queues, case workspace, doc viewer, validator, audit log, admin) → `industrial-brutalist-ui`, **Swiss Industrial Print mode only**, with degradation effects (CRT, halftone, ASCII brackets, hazard-red accent) **disabled**.
- **All UI work** → pair with `full-output-enforcement`.

If a skill's rule conflicts with `docs/DESIGN-LANGUAGE.md`, the document wins. Do not import banned patterns (pill nav, fluid-island modal, magnetic button physics, CRT scanlines, halftone, ASCII brackets, hazard red, pastel multi-accent palettes) even when the skill prescribes them.

## Common mistakes to catch

- "Default Tailwind blue / indigo / purple" — replace with our palette.
- Soft shadows — replace with hairline rules.
- Default shadcn button style — re-theme to the magazine-underline pattern.
- Loading spinners with bouncy keyframes — replace with the restrained progress pattern.
- Status colors used decoratively — they are meaning-bearing.

## Why this matters

Trust is the product. Generic SaaS aesthetics actively undermine the editorial-utilitarian credibility we need to earn customers. Restraint signals competence; bounce signals "another AI startup."

## How to apply

When implementing a new screen, ask: would this look out of place pinned next to a Stripe Press book and a CBP form on a serious operator's desk? If yes, redesign before merging.
