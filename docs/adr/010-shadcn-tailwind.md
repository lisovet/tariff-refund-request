# ADR 010 — shadcn/ui + Tailwind + Radix for UI

**Status:** Accepted

## Context

We need a polished marketing site (high design bar) and a dense ops console (utility-heavy) sharing one design system. Building component primitives is NIH; adopting a heavyweight component library (MUI, Ant) imposes their aesthetic and runtime cost.

## Decision

- **Tailwind** for styling.
- **Radix UI primitives** for accessible behavior (dialogs, popovers, comboboxes).
- **shadcn/ui** for opinionated, customizable Radix-based components copied into the repo.

Custom design tokens in `tailwind.config.ts` — single source of truth for colors, spacing, typography.

## Consequences

- ✅ Components live in our repo — no version-bump rug pulls.
- ✅ Radix primitives are accessibility-tested by their team.
- ✅ Tailwind's purging keeps CSS small.
- ⚠️ shadcn/ui components are templates, not packages — we own them, including bug fixes.

## Test-impact

- Component tests use Testing Library against the rendered DOM.
- Visual regression (Phase 1) via Playwright screenshot diffs against a Storybook.
