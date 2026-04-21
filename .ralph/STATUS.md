# Ralph Loop Status

**Updated**: 2026-04-21T06:16:30Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 8 → 9)

## Counts

| Status | Count |
| --- | --- |
| completed | 8 |
| in-progress | 0 |
| pending | 78 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 13 files, 81 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — middleware (85kB) + sign-in / sign-up routes compile |
| `npm run qa` (combined) | green |

## Last completed task

**#8 — Wire Clerk for customer accounts**

- `@clerk/nextjs` + `@clerk/testing` installed.
- `ClerkProvider` wraps the root layout.
- `src/middleware.ts` uses `clerkMiddleware` + `isProtectedRoute` predicate to gate `/app/**`, `/ops/**`, `/api/cases/**`, `/api/uploads/**`. Unauthed → `redirectToSignIn({ returnBackUrl })`.
- Pure predicates `isPublicRoute` / `isProtectedRoute` in `src/shared/infra/auth/route-gating.ts` — unit-testable without the middleware runtime.
- Themed sign-in / sign-up pages at `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx`. Appearance overrides re-skin Clerk to our token system (bg-paper, font-display GT Sectra fallback chain, ink-on-paper, customs-orange `--accent` for the footer link).
- `Actor` type surface in `src/shared/infra/auth/actor.ts` (`CustomerActor | StaffActor | AnonymousActor` with `isAnonymous` / `isCustomer` / `isStaff` discriminants). Full Clerk → Actor resolver lands in task #10.
- Playwright protected-redirect spec at `tests/e2e/anonymous/protected-redirect.spec.ts` — skips when Clerk env unset.
- 29 new tests (route-gating + actor) — RED-confirmed before implementation.
- Bug caught + fixed: `PUBLIC_PREFIXES` used trailing-slash patterns that didn't match nested webhook paths.

## Human-verification still owes

- Real Clerk dashboard sign-up; `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`.
- Google OAuth provider configured in Clerk dashboard.
- End-to-end Playwright sign-up → sign-in → access /app flow.

## Next eligible

Task #9 — Configure Clerk staff org with roles (depends on #8; eligible). Adds the (ops) gating + role enum.

## Notes

- Wave 2 (auth + roles) underway — 1/4 done.
- Loop will continue with task #9 next iteration.
