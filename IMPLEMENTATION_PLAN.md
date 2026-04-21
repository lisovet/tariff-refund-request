# V1 Implementation Plan

> Plan for the autonomous Ralph Loop that builds Phase 0 (v1) of the IEEPA Refund / CAPE Filing-Prep Platform.
>
> Companion documents (read these — they bind the implementation):
> - `docs/VISION.md` — what the product is
> - `docs/DESIGN-LANGUAGE.md` — visual contract + binding Surface → skill mapping
> - `docs/SKILLS-ROUTING.md` — pipeline + per-area skill picks
> - `docs/architecture-decisions.md` + `docs/adr/*` — 15 ADRs (stack, data, auth, payments, storage, workflows, state machine, validation, UI, testing, email, observability, CAPE schema, recovery routing)
> - `docs/prds/*` — 12 PRDs, one per bounded context
> - `.taskmaster/docs/prd.md` — master PRD (validates EXCELLENT 100%)
> - `.taskmaster/tasks.json` — 86 atomic Phase 0 tasks + 15 USER-TEST checkpoints + Phase 1/2/3 placeholders
> - `.claude/rules/*` — project hard rules (never-auto-submit, human-QA-required, entry-provenance-required, routing-as-domain-logic, disclosure-language-required, design-language-gate)
> - `~/.claude/CLAUDE.md` — global pipeline + TDD + branch-safety rules

## Goal

Build everything that can be built unattended for v1 — the entire codebase, schemas, tests, components, validators, state machine, lifecycle workflows — using local stubs in place of paid third-party services. End state: a fully tested platform that compiles, lints, type-checks, and runs locally; production-ready code with clear `// TODO(human-action): <add real key / sign up / acquire spec>` markers where human action is required.

## What runs unattended

- All TypeScript code: contexts, schemas, route handlers, components, server actions
- All Drizzle migrations + schema
- All Vitest unit + integration tests (TDD: red → green → refactor)
- All Inngest workflows (using Inngest dev server)
- All XState case-machine model-based tests via `@xstate/test`
- All CAPE validator golden-file fixtures (with synthesized but realistic structure)
- All UI components (themed per `docs/DESIGN-LANGUAGE.md`, fonts via fallback chain)
- All quality gates: `npm run test`, `npm run lint`, `npm run typecheck`
- Local commits to the `claude/scaffold-platform` branch

## What is human-blocked (loop marks `human-blocked`, skips, reports at end)

- **Third-party accounts + keys**: Clerk, Stripe (live mode), Cloudflare R2 (production), Neon (production), Inngest cloud, Resend, Sentry, Axiom. (Local stubs: MinIO, stripe-mock, in-memory adapters, console logger.)
- **Custom font licenses**: GT Sectra, Söhne, Berkeley Mono. Implementation uses CSS variable + fallback chain to system serifs/sans/mono until licensed.
- **Real CBP CAPE format spec**: validator implements a defensible structural schema based on the PRDs but the field-by-field CBP requirements need the actual spec to confirm. Marked `// TODO(spec-action)`.
- **Real document fixtures**: 7501 / ACE export / carrier invoice fixtures — synthesized realistic-shape fixtures used for tests; real anonymized samples needed before production.
- **Production deploy**: Vercel/Neon production wiring requires accounts.
- **Engagement letter legal review**: template drafted; needs counsel.
- **Marketing photography**: documentary photo of CBP form. Placeholder in code; design notes capture intent.

## TDD discipline (binding)

For every task that produces production code:

1. Read the task's acceptance criteria from `.taskmaster/tasks.json` and the source PRD.
2. Write failing tests covering the acceptance criteria (Given / When / Then).
3. Run `npm test`. Confirm RED.
4. Write the minimum implementation to pass.
5. Run `npm test`. Confirm GREEN.
6. Refactor. Re-run tests. Stay GREEN.
7. Run `npm run lint && npm run typecheck`. All must pass.
8. Stage, commit. Format: `task <id>: <title>` body containing one-line summary + `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

## Skill discipline (binding)

Per `docs/SKILLS-ROUTING.md`:

- UI scaffolding → `/taste-skill <description>`, pick per Surface map, pair with `full-output-enforcement`.
- Implementation → `coder` discipline (TDD-first, red/green/refactor).
- AI / LLM code → `claude-api` skill (mandatory for any code touching `@anthropic-ai/sdk`).
- Touching auth / retention / billing → also invoke `security-review` reasoning.
- Touching the case state machine → `qa-monkey` adversarial coverage required.

## Backlog ordering

The loop picks the **lowest-id task with `status: "pending"` and no unresolved `dependencies`**, in this order:

| Wave | Tasks | Theme |
| --- | --- | --- |
| 1 | 1, 2, 3, 4, 5, 6 | Foundation — Next.js, Drizzle, R2/MinIO, Inngest, Sentry/Axiom, Vitest/Playwright |
| | 7 | USER-TEST: foundation works |
| 2 | 8–11 | Auth + roles |
| | 12 | Theme tokens + design system primitives |
| | 13 | USER-TEST: auth + design |
| 3 | 14–18 | Marketing site |
| | 19 | USER-TEST: marketing live |
| 4 | 20–25 | Eligibility screener |
| | 26 | USER-TEST: real screener walkthrough |
| 5 | 27–31 | Lifecycle email + Inngest workflows |
| | 32 | USER-TEST: emails reviewed |
| 6 | 33–37 | Stripe + pricing ladder |
| | 38 | USER-TEST: end-to-end purchase |
| 7 | 39–42 | Case state machine + audit log |
| | 43 | USER-TEST: state machine governance |
| 8 | 44–47 | Document storage + uploads |
| | 48 | USER-TEST: upload + viewer |
| 9 | 49–53 | Entry recovery workspace |
| | 54 | USER-TEST: recovery workflow |
| 10 | 55–59 | Entry ingestion + normalization |
| | 60 | USER-TEST: ingestion handles real-world ACE |
| 11 | 61–65 | CAPE schema + validator + CSV |
| | 66 | USER-TEST: validator on real fixtures |
| 12 | 67–70 | Readiness Report PDF |
| | 71 | USER-TEST: photographable Readiness Report |
| 13 | 72–75 | Trust posture + engagement letter |
| | 76 | USER-TEST: trust review |
| 14 | 77–82 | Ops console |
| | 83 | USER-TEST: ops staff complete a full case |
| 15 | 84, 85 | Lint rule + funnel metrics |
| | 86 | USER-TEST: Phase 0 launch readiness |

USER-TEST tasks are **completed without skipping** by the loop — but with a note that real human verification still needs to happen. The loop attests to the *implementation* readiness; human attests to the *experience* readiness.

## Loop completion criteria

- All tasks with `id ≤ 86` have `status: "completed"` OR `status: "human-blocked"` in `.taskmaster/tasks.json`.
- `npm run test` passes with coverage thresholds met (lines ≥ 80, branches ≥ 75 on context code).
- `npm run lint` exits clean.
- `npm run typecheck` exits clean.
- `.ralph/STATUS.md` lists every completed task and every human-blocked task with reason.
- The loop emits `<promise>V1_COMPLETE</promise>`.

## Loop emergency stops

- Two consecutive iterations with no progress (no task completed, no commit made) → emit `<promise>STALLED — see .ralph/STATUS.md for blocker</promise>` and stop.
- A test fails on a task that was previously green → fix-it-forward; if 3 consecutive iterations cannot restore green, mark task as `regressed`, emit a STALLED promise.
- Quality gate fails on commit → fix and recommit; do not skip the gate.

## What the loop is NOT allowed to do

- Force-push or push to remote (per CLAUDE.md branch safety).
- Bypass test/lint/typecheck gates.
- Auto-submit anything to CBP (per `.claude/rules/never-auto-submit.md`).
- Allow `submission_ready` state without validator role sign-off (per `.claude/rules/human-qa-required.md`).
- Insert entries without provenance (per `.claude/rules/entry-provenance-required.md`).
- Branch on `recoveryPath` outside `src/contexts/recovery/routing.ts` (per `.claude/rules/routing-as-domain-logic.md`).
- Remove canonical disclosure language (per `.claude/rules/disclosure-language-required.md`).
- Use Inter / system fonts / default Tailwind colors / default shadcn buttons (per `.claude/rules/design-language-gate.md`).
- `npm install -g` anything globally without an explicit task asking for it.
- Commit secrets (.env, credentials, API keys).

## Reporting

Each iteration appends a one-line entry to `.ralph/PROGRESS.md`:

```
<iso-timestamp> task <id> <status> — <short note>
```

`.ralph/STATUS.md` is rewritten at the end of each iteration with: completed counts, in-progress, blocked-with-reasons, last test/lint/typecheck status.
