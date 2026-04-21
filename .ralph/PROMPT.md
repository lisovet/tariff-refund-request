# Ralph Loop Prompt — V1 Implementation

You are continuing autonomous implementation of v1 (Phase 0) for the IEEPA Refund / CAPE Filing-Prep Platform. This same prompt is fed to you on every iteration; your previous work is preserved in the file system and git history. Read the file system to know where you are.

## Your loop, every iteration

1. **Check stop conditions first.**
   - If all tasks with `id ≤ 86` in `.taskmaster/tasks.json` are `completed` or `human-blocked`, run `npm run test && npm run lint && npm run typecheck`. If all pass, rewrite `.ralph/STATUS.md` with the final summary and emit exactly: `<promise>V1 COMPLETE</promise>`. Stop.
   - If two consecutive iterations have made no progress (check `.ralph/PROGRESS.md`), rewrite `.ralph/STATUS.md` with the blocker, and emit `<promise>STALLED — see .ralph/STATUS.md</promise>`. Stop.

2. **Pick the next task.** Lowest `id` in `.taskmaster/tasks.json` with `status: "pending"` AND every entry in `dependencies` already `completed`. If none eligible, your wave is blocked — investigate and either unblock or mark as `human-blocked` with a reason in `details`.

3. **Read the task's source PRD** (path is in `source` field). Read every `.claude/rules/*` file that applies. Read `docs/DESIGN-LANGUAGE.md` for any UI work. Read `docs/SKILLS-ROUTING.md` for which skill to invoke.

4. **TDD red → green → refactor.**
   a. Write failing tests covering the task's `acceptance` criteria (Given/When/Then). Test file path: `src/contexts/<context>/__tests__/<file>.test.ts` or `tests/integration/<area>/<file>.test.ts`.
   b. Run `npm test -- --run <test-file>`. Confirm RED. If already GREEN, the test is wrong — fix it.
   c. Write minimal production code to pass.
   d. Run `npm test -- --run <test-file>`. Confirm GREEN. If RED, debug and fix before moving on.
   e. Refactor while keeping tests GREEN.

5. **Quality gates** (mandatory before commit):
   - `npm test` (full suite). All pass.
   - `npm run lint`. Clean.
   - `npm run typecheck`. Clean.
   If any gate fails: fix the underlying issue, do not skip the gate. Never use `--no-verify`.

6. **Commit.** Stage only the files you changed for this task. Do not stage `.env`, `.claude/.ralph-loop.local.md`, or anything in `.gitignore`. Commit message format:
   ```
   task <id>: <title>

   <one-line summary of what was built>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```
   Branch is `claude/scaffold-platform`. Never push, never force, never amend.

7. **Update tasks.json.** Set this task's `status` to `completed`. Save.

8. **Update .ralph/PROGRESS.md.** Append: `<iso-utc> task <id> completed — <short note>`.

9. **Update .ralph/STATUS.md.** Rewrite with: completed count, pending count, human-blocked count + reasons, last test status.

10. **Stop.** The loop will re-feed this prompt.

## Hard rules (binding — these come from `.claude/rules/`)

- **Never auto-submit to CBP.** No code path may submit to CBP submission endpoints.
- **Human-QA gate.** No transition to `submission_ready` without a validator-role actor.
- **Entry provenance.** Every `EntryRecord` insert references at least one `EntrySourceRecord`. Schema columns are NOT NULL.
- **Routing as domain logic.** No `if (path === 'broker')` checks outside `src/contexts/recovery/routing.ts`.
- **Disclosure language.** Canonical trust promise verbatim across surfaces; "Not legal advice" footnote on every page.
- **Design-language gate.** No system fonts, no default Tailwind colors, no default shadcn buttons. Per surface, the right taste skill from `docs/DESIGN-LANGUAGE.md` Surface map applies; CRT scanlines / halftone / ASCII brackets / aviation hazard red / pill nav / fluid island / magnetic physics — all banned even when a chosen skill prescribes them.
- **Never commit secrets.** Use `.env.example` for required env shape; never `.env` itself.
- **Local commits only.** Never push.
- **TDD is non-negotiable.** No production code before a failing test exists for it.

## Local stubs for human-blocked services

When a task requires a third-party service:

- **Clerk** → use `@clerk/testing` helpers + a stub Actor resolver behind `src/shared/infra/auth/`. Mark `// TODO(human-action): wire real Clerk keys` at the env-loading boundary.
- **Stripe** → use `stripe-mock` for unit tests; for integration tests, write code that targets real Stripe test-mode but skip the actual call when `STRIPE_SECRET_KEY` is missing — emit a clear test-skip notice.
- **R2** → use MinIO via Docker; if Docker isn't available, use the in-memory S3 client adapter at `src/shared/infra/storage/memory.ts` and gate adoption via env.
- **Inngest** → use the Inngest dev server (already added to `npm run dev`). For tests, use Inngest's `serve` testing utilities.
- **Resend** → use a console-logging email transport adapter when `RESEND_API_KEY` is missing.
- **Sentry / Axiom** → no-op transports when keys are missing.
- **Custom fonts (GT Sectra / Söhne / Berkeley Mono)** → CSS variable + fallback chain to system serifs/sans/mono. Add `// TODO(human-action): license and self-host fonts` at font definition. Render fallbacks faithfully.

## Tools you may need

You may run `npm install <pkg>` to add dependencies. Prefer pinned versions matching the ADRs (Next 15, Drizzle, Clerk, Stripe SDK, Inngest, Resend, Vitest, Playwright, etc.). Do not `npm install -g` anything unless a task explicitly requires it. Do not modify `package.json` `scripts` unless a task explicitly requires it.

You may invoke skills via the Skill tool when scaffolding UI (`/taste-skill <description>`), implementing AI code (`/claude-api`), or writing tests (`/test-driven-development`). Pair UI work with `full-output-enforcement`.

You may use `Agent` to spawn parallel research/exploration agents when a task touches multiple unfamiliar areas — but the implementation work itself stays in this loop.

## When you genuinely cannot proceed

If a task cannot be done unattended (e.g., requires real Clerk webhook from a real Clerk account that doesn't exist):

1. Set the task's `status` to `human-blocked` in `.taskmaster/tasks.json`.
2. Set the task's `details` to include `BLOCKER: <one-sentence reason>`.
3. Build the **scaffolding** the task would have built — adapter signatures, config slots, env shape, stub implementations, tests against the stubs — so when human action lands, only wiring is left.
4. Append to `.ralph/PROGRESS.md`: `<iso-utc> task <id> human-blocked — <reason>`.
5. Move on to the next eligible task.

## Iteration discipline

- One task per iteration. Do not batch.
- Commit each task separately.
- Re-read this prompt at the start of every iteration. The plan is in `IMPLEMENTATION_PLAN.md`.
- If you find yourself doing work that isn't in `tasks.json`, stop. Add the task first, then do it.
- Refresh `.ralph/STATUS.md` every iteration so a human checking in can read it and know where you are.

## Completion promise

When all v1 tasks are `completed` or `human-blocked` and quality gates pass, emit exactly:

```
<promise>V1 COMPLETE</promise>
```

Otherwise the loop continues.
