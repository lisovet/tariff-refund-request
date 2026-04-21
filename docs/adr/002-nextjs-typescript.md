# ADR 002 — Next.js (App Router) + TypeScript strict

**Status:** Accepted

## Context

We need three distinct front-ends: (1) a marketing site with SEO requirements, (2) an authenticated customer app with rich workflows, and (3) an internal ops console. Building three separate apps would triple deploy/auth/build complexity. The product also has long-running form flows (screener, upload, prep) where SSR + RSC reduce client JS substantially.

## Decision

Single **Next.js 15 App Router** application with route groups:

```
app/
  (marketing)/        # public, SEO-indexed, no auth
  (app)/              # customer-authenticated workflows
  (ops)/              # staff-only ops console
  api/                # route handlers (thin — delegate to contexts)
```

TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`). No `any` outside generated types. ESLint enforces the context-boundary rules from ADR 001.

## Consequences

- ✅ One repo, one deploy, one auth surface, one design system.
- ✅ RSC keeps the ops console's heavy tables off the client bundle.
- ✅ Marketing pages can be statically generated at build time.
- ⚠️ Route groups are a soft boundary — middleware enforces auth and role gating per group.
- ⚠️ Vendor lock-in to Vercel for some features (ISR, edge functions). Acceptable trade-off pre-PMF.

## Test-impact

- Component tests use Vitest + Testing Library.
- E2E tests use Playwright with role-scoped fixtures (anonymous, customer, ops-staff).
- Route handlers are tested as regular TS functions, not via HTTP.
