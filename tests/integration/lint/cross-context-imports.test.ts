import { beforeAll, describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'

/**
 * ADR 001 enforcement — the `no-restricted-imports` rule in
 * `eslint.config.mjs` blocks deep imports across bounded-context
 * boundaries. This test proves the rule bites + confirms the two
 * sanctioned surfaces stay open.
 *
 * Fixtures are lint-only — ESLint is run programmatically with the
 * repo config against an in-memory source string so we don't need
 * to commit a .bad.ts file whose very presence would fail the real
 * `npm run lint` job in CI.
 */

let eslint: ESLint

// Loading ESLint's config + plugin graph takes ~3s and only happens on
// the first `lintText` call. Doing it in beforeAll (with a warm-up
// call) keeps every test body well under vitest's default timeout.
beforeAll(async () => {
  eslint = new ESLint({
    overrideConfigFile: new URL('../../../eslint.config.mjs', import.meta.url).pathname,
  })
  await eslint.lintText('export const warmup = 1\n', { filePath: 'warmup.ts' })
}, 30_000)

async function messagesFor(source: string, filename = 'fixture.ts') {
  const results = await eslint.lintText(source, { filePath: filename })
  return results[0]?.messages ?? []
}

describe('ADR 001 — cross-context public surface lint rule', () => {
  it('allows @contexts/<name> imports (UI-safe surface)', async () => {
    const msgs = await messagesFor(
      `import type { CaseState } from '@contexts/ops'\nexport const s: CaseState = 'new_lead'\n`,
    )
    const restricted = msgs.filter((m) => m.ruleId === 'no-restricted-imports')
    expect(restricted).toEqual([])
  })

  it('allows @contexts/<name>/server imports (server-only surface)', async () => {
    const msgs = await messagesFor(
      `import { getCaseRepo } from '@contexts/ops/server'\nexport const r = getCaseRepo\n`,
    )
    const restricted = msgs.filter((m) => m.ruleId === 'no-restricted-imports')
    expect(restricted).toEqual([])
  })

  it('blocks deep imports into an internal module (@contexts/<name>/repo)', async () => {
    const msgs = await messagesFor(
      `import type { CaseRepo } from '@contexts/ops/repo'\nexport const r: CaseRepo = undefined as unknown as CaseRepo\n`,
    )
    const restricted = msgs.filter((m) => m.ruleId === 'no-restricted-imports')
    expect(restricted.length).toBeGreaterThan(0)
    expect(restricted[0]?.message).toMatch(/ADR 001|public surface/i)
  })

  it('blocks deep imports into a nested internal path', async () => {
    const msgs = await messagesFor(
      `import { something } from '@contexts/ops/workflows/stalled-cadence'\nvoid something\n`,
    )
    const restricted = msgs.filter((m) => m.ruleId === 'no-restricted-imports')
    expect(restricted.length).toBeGreaterThan(0)
  })

  it('blocks @contexts/*/case-machine (the specific leakage ADR 001 names)', async () => {
    const msgs = await messagesFor(
      `import { isValidTransition } from '@contexts/ops/case-machine'\nvoid isValidTransition\n`,
    )
    const restricted = msgs.filter((m) => m.ruleId === 'no-restricted-imports')
    expect(restricted.length).toBeGreaterThan(0)
  })
})
