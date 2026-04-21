# Skills Routing

The single source of truth for which Claude Code skills get used where in this repo. PRD-specific skill picks live in each PRD's `### Skills` section; this document covers the **cross-cutting** ones plus the full inventory so nothing is overlooked.

If a skill exists in this install but is not listed here, it is intentionally out of scope (see "Not in use" at the bottom).

---

## 1. Pipeline skills (cross-cutting — apply to almost every PRD)

These run on the development pipeline regardless of which PRD is being worked on. Per-PRD `### Skills` sections do not need to repeat them.

| Phase | Skill | When |
| --- | --- | --- |
| Strategic filter | `plan-ceo` | Before planning *how* on any new feature or capability. Skip for bug fixes / refactors. |
| Planning | `planner` | Any task touching 3+ files or involving design decisions — full 10-pass adversarial review. |
| PRD review | `critic` | Adversarial PRD review before code is written. |
| PRD generation / refresh | `prd-taskmaster` | Initial backlog (already done) and major PRD revisions. |
| Implementation | `coder` | TDD-first implementation of approved plans. |
| Tests | `test-driven-development` | **Hard rule** — no implementation code before failing tests exist. |
| Architecture | `software-architecture` | When introducing new contexts, refactoring boundaries, or making build-vs-buy calls. |
| Reactive bug investigation | `debugger` | A known symptom needs root-cause diagnosis (instrument, hypothesize, eliminate, fix, clean up). |
| Proactive bug hunting | `qa-monkey` | Stress-test surfaces for unknown bugs (state machine transitions, edge cases, concurrency). |
| Final review | `judge` | Production-readiness gate before merge for high-stakes changes (case state machine, validator, billing, auth, retention). |
| Cleanup | `simplify` | After a logical chunk of work — refines for clarity / reuse / efficiency without changing behavior. |
| Push + PR | `ship` | When ready to push and open a PR — runs the quality gates automatically. |
| Multi-phase coord | `pipeline-orchestrator` | When orchestrating planner → coder → qa-monkey → judge across a long feature. |
| Issue work | `fix-issue` | When a GitHub issue defines the work. |
| CLAUDE.md / rules audit | `claude-md-improver` | Periodic — quarterly or after major architectural changes. |
| PR review | `pr-review-toolkit:review-pr`, `code-review:code-review` | Every PR review (especially trust-sensitive ones — see PRD 10). |
| QA loop management | `qa-fix`, `qa-findings`, `cancel-qa` | Triage + remediate QA Monkey findings. |

## 2. Taste skills (per surface — see `docs/DESIGN-LANGUAGE.md` for the binding map)

| Surface | Primary skill |
| --- | --- |
| Marketing site (sitewide) | `minimalist-ui` |
| Marketing homepage hero | + `high-end-visual-design` Editorial Luxury |
| Customer app, PDFs, engagement letters | `minimalist-ui` |
| Ops console (queues, case workspace, doc viewer, validator, audit log) | `industrial-brutalist-ui` Swiss Industrial Print mode (degradation effects disabled) |
| Partner dashboard (Phase 3) | `industrial-brutalist-ui` Swiss mode |
| All UI scaffolding | + `full-output-enforcement` |

Skills available in this install but **not in use** for this product: `gpt-taste` (too animation-heavy for our restraint contract), `stitch-design-taste` (we are not handing off to Google Stitch), `ios-frontend-design` (no native iOS app), `redesign-existing-projects` (we are greenfield), `design-taste-frontend` (covered by `minimalist-ui` for app surfaces).

## 3. Marketing & copywriting skills (PRD 05, lifecycle email, blog)

| Skill | When |
| --- | --- |
| `copywriting-strategist` | Brainstorming angles for headlines, anti-positioning, lifecycle email subject lines. |
| `copywriting-formatter` | Turning approved angles into finished homepage / pricing / lifecycle copy. |
| `advertorial-writer` | Long-form SEO-first articles (e.g., *"How to find your entry numbers when your broker won't reply"*, *"What 'liquidation' means and why it matters for your refund"*). Editorial register. |
| `copywriting-optimizer` | Once we have traffic — A/B test hypotheses for the homepage CTA, pricing-page copy, and lifecycle subject lines. |
| `ad-validator` | Stress-test homepage and pricing-page copy with the hostile-persona protocol before launch. |
| `image-prompt` | Generating Nano Banana / Gemini prompts for hero documentary imagery (e.g., *"high-contrast black-and-white photograph of a CBP entry summary form on a wooden desk, soft window light, documentary style"*). |
| `ad-creator` | Producing the actual marketing imagery with Nano Banana / Gemini once prompts are dialed. |

Skills **not in use**: `vitalfuel-brand`, `maya-metabolism-brand` (other clients' brand layers — irrelevant here).

## 4. AI / LLM skills (PRD 08 — Phase 2+)

| Skill | When |
| --- | --- |
| `claude-api` | **Mandatory** for any code touching `@anthropic-ai/sdk` — enforces prompt caching, model selection (Opus 4.7 / Sonnet 4.6 / Haiku 4.5), tool-use patterns, and migration discipline. |
| `vision-analyst` | When customers upload screenshots that need analysis (Phase 1+ for support-issue triage; Phase 2 for OCR/extraction QA). |
| `test-driven-development` | Eval suites for every prompt template — golden-file before deploy. |

## 5. Security & compliance (PRD 10)

| Skill | When |
| --- | --- |
| `security-review` | Before every PR that touches auth, retention, document storage, sub-processor lists, or audit-log behavior. |
| `pr-review-toolkit:review-pr` | All trust-sensitive PRs go through the toolkit's reviewer agents. |
| `code-review:code-review` | Standard code review on every PR. |

## 6. Partner / integration skills (PRD 09 — Phase 3)

| Skill | When |
| --- | --- |
| `shopify-expert` | When integrating with Shopify Plus partners or building embedded screener variants for ecommerce agencies' Shopify sites. |

## 7. Operational skills (cross-cutting infrastructure)

| Skill | When |
| --- | --- |
| `update-config` | Modifying `~/.claude/settings.json` (hooks, permissions, env vars). |
| `keybindings-help` | Customizing keyboard shortcuts. |
| `fewer-permission-prompts` | Tightening the permission allowlist after a session. |
| `loop` | Recurring tasks (e.g., poll Inngest queue depth, monitor a long deploy). |
| `schedule` | Cron-driven remote agents (e.g., daily SLA breach scan). |
| `claude-mem:make-plan`, `claude-mem:do` | Multi-phase implementation planning + execution. |
| `claude-mem:mem-search`, `claude-mem:smart-explore`, `claude-mem:knowledge-agent` | Cross-session memory + structural exploration of the codebase. |
| `claude-mem:timeline-report`, `claude-mem:version-bump` | Periodic project history reports + plugin version management. |
| `feature-dev:feature-dev` | Guided feature development walkthrough when scope is unclear. |
| `claude-md-management:revise-claude-md` | Update CLAUDE.md with session learnings. |
| `ralph` / `ralph-loop:ralph-loop` | Autonomous long-running implementation loop (Phase 0+ when a backlog is ready). |
| `prd-ralph` | Convert this PRD set to ralph format if/when we adopt the Ralph autonomous agent system. |

## 8. Skills explicitly not in use

These exist in the install but are not relevant to this product. Listed so a future maintainer doesn't waste time evaluating them:

- `gpt-taste`, `stitch-design-taste`, `ios-frontend-design`, `redesign-existing-projects`, `design-taste-frontend` — see Taste section above.
- `vitalfuel-brand`, `maya-metabolism-brand` — other clients' brand layers.
- `_archived_*` — archived; ignore.
- `init`, `review`, `security-review` (built-in CLI commands, distinct from `pr-review-toolkit:security-review` if it exists) — overlap with the named skills above, use the named ones.

## 9. Workflow heuristics

- **Starting a new feature**: `plan-ceo` → `planner` → `critic` → `coder` (with `test-driven-development`) → `qa-monkey` → `judge` → `ship`.
- **Fixing a known bug**: `debugger` → `coder` → `judge` → `ship`.
- **Scaffolding a new UI**: `/taste-skill <description>` (router picks per design-language map) + `full-output-enforcement` → `coder` → design-language gate review → `judge` → `ship`.
- **Touching auth / retention / billing**: add `security-review` and require two-person sign-off per PRD 10.
- **Touching the case state machine**: `qa-monkey` + `judge` are mandatory; model-based `@xstate/test` covers the transitions.
- **Touching the CAPE validator or pricing.ts**: golden-file fixtures + `judge` are mandatory.

## 10. Pointer summary

- Per-PRD skill picks: `docs/prds/00..11.md` `### Skills` sections.
- Surface → taste skill mapping (binding): `docs/DESIGN-LANGUAGE.md`.
- Cross-cutting pipeline: this document.
- Project rules that enforce skill invocation: `.claude/rules/design-language-gate.md`.
- Global pipeline policy: `~/.claude/CLAUDE.md` "Pipeline Skills" section.
