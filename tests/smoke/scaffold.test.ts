import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Smoke tests for task #1 — Scaffold Next.js 15 + TypeScript strict monorepo.
 *
 * Acceptance: build succeeds, npm run lint and npm run typecheck exit clean.
 * These tests verify the structural pieces are in place so future iterations
 * can build on a known-good shell.
 */

const root = process.cwd()

describe('scaffold: route groups', () => {
  it.each([
    ['marketing /', 'src/app/(marketing)/page.tsx'],
    ['app /app', 'src/app/(app)/app/page.tsx'],
    ['ops /ops', 'src/app/(ops)/ops/page.tsx'],
    ['api /api/health', 'src/app/api/health/route.ts'],
    ['api /api/inngest', 'src/app/api/inngest/route.ts'],
  ])('exposes the %s route', (_label, path) => {
    expect(existsSync(join(root, path))).toBe(true)
  })

  it('has a root layout', () => {
    expect(existsSync(join(root, 'src/app/layout.tsx'))).toBe(true)
  })

  it('has the design-tokens stylesheet', () => {
    expect(existsSync(join(root, 'src/app/globals.css'))).toBe(true)
  })
})

describe('scaffold: configs', () => {
  it.each([
    'tsconfig.json',
    'next.config.ts',
    'tailwind.config.ts',
    'postcss.config.mjs',
    'eslint.config.mjs',
    'vitest.config.ts',
  ])('has %s', (file) => {
    expect(existsSync(join(root, file))).toBe(true)
  })
})
