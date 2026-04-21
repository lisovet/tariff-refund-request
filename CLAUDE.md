# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**IEEPA Refund Audit, Entry Recovery, and CAPE Filing-Prep Platform** — a service-heavy SaaS that helps U.S. importers (1) screen for IEEPA tariff-refund eligibility, (2) recover entry numbers from broker / carrier / ACE sources, and (3) prepare a submission-ready CAPE declaration file with human QA.

Core thesis: **submission readiness** is the paid product. The funnel is `eligibility screener → entry recovery → CAPE filing prep → concierge`. Entry recovery and CSV prep are first-class deliverables, not workflow steps.

## Status

Greenfield. No code yet. Stack and tooling decisions live in `docs/architecture-decisions.md` once the software-architecture pass completes. PRDs live in `docs/prds/` and the working backlog in `.taskmaster/`.

## Architecture (intent)

```
┌────────────────────────────────────────────────────────────────┐
│  Marketing site + screener (public)                            │
│      ↓ lead                                                    │
│  Customer app: results → recovery workspace → CAPE prep        │
│      ↓ uploads, payments                                       │
│  Backoffice / ops console: queues, doc viewer, validator, QA   │
│      ↓ artifacts                                               │
│  Domain core: cases, entries, batches, readiness reports       │
│      ↓                                                         │
│  Storage: Postgres (cases/entries) + object store (docs)       │
└────────────────────────────────────────────────────────────────┘
```

Key bounded contexts (to be enforced as modules / packages):
- **Screener** — branching eligibility logic, qualification routing.
- **Recovery** — broker / carrier / ACE path workflows, outreach kits, doc ingestion.
- **Entries** — canonicalization, dedupe, phase segmentation, source-confidence tracking.
- **CAPE Prep** — CSV builder, batch validator, readiness report generator.
- **Ops** — case state machine, queues, SLA tracking, QA checklists.
- **Billing** — stage-based pricing ladder + success-fee accounting.

Case state machine is the system's spine — see `docs/prds/04-admin-ops.md` once generated. State transitions must be the only way `Case.state` changes.

## Hard product rules (drive code decisions)

- The system **prepares** files; it does not auto-submit to CBP. Any code path implying auto-filing is wrong.
- **Human review is required** before any artifact ships to a customer as "submission ready." No path bypasses QA.
- Recovered entries always carry a **source + confidence** record; never store an entry without provenance.
- Routing logic (broker vs carrier vs ACE) is **product logic**, not UX glue — model it explicitly.
- "Not legal advice" and "you control submission" disclosures are part of the product, not just marketing copy.

## Commands

To be filled in once stack is chosen. Until then, defer to global defaults in `~/.claude/CLAUDE.md` (Vitest / ESLint / Prettier / Zod for JS-TS; pytest / ruff / pydantic for Python).

## Where to look

- `docs/prds/` — feature PRDs (one per area: screener, recovery, CAPE prep, ops, growth, monetization, ingestion, AI, partner, trust, roadmap). Each one names the **taste skill** and other implementation skills it depends on.
- `docs/DESIGN-LANGUAGE.md` — the visual contract + the binding **Surface → skill mapping** table (which taste skill owns which surface; which skill rules we keep vs override).
- `docs/architecture-decisions.md` — ADRs for stack, data model, deploy target.
- `.taskmaster/` — active backlog, task state, dependency graph.
- `.claude/rules/` — project-specific rules layered on top of `~/.claude/rules/`. `design-language-gate.md` enforces the skill-selection workflow.

## Skills routing (cheat sheet)

When scaffolding any UI work, run `/taste-skill <description>` and verify it picks per the mapping in `docs/DESIGN-LANGUAGE.md`:

- Marketing → `minimalist-ui` (+ `high-end-visual-design` Editorial Luxury for homepage hero only)
- Customer app + PDFs → `minimalist-ui`
- Ops console → `industrial-brutalist-ui`, **Swiss Industrial Print mode only** (CRT scanlines / halftone / ASCII brackets / hazard red **disabled**)
- Always pair with `full-output-enforcement`

Non-design skills called out per PRD: `claude-api` (mandatory for PRD 08), `test-driven-development` (mandatory for the validator, pricing.ts, parsers, eval suites), `software-architecture` for context boundaries, `security-review` for any auth/retention/data-export PR.

## Non-goals (do not build)

- Direct CBP submission.
- Generic customs/trade SaaS framing.
- Enterprise multi-entity dashboards at launch.
- Fully-automated document parsing in v1 (OCR is Phase 2).
- Legal-advice workflows.
