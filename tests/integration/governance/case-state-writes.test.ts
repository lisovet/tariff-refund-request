import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * State-machine governance per PRD 04 + ADR 008 + task #43:
 * `cases.state` may only be mutated by code inside `src/contexts/ops/`,
 * via the case service `transition()`. Direct INSERT/UPDATE on the
 * cases table from any other context is a violation.
 *
 * This test walks the source tree (excluding tests, the schema
 * definition itself, and the canonical ops context) and grep-fails
 * if it finds a `cases.state` write or a drizzle update against the
 * cases table.
 */

const ROOT = join(process.cwd(), 'src')

const ALLOWED_DIRS = [
  // The case-machine itself, the service, and the two repo
  // implementations — by definition they are the only writers.
  join(ROOT, 'contexts', 'ops'),
  // Schema definition declares the column.
  join(ROOT, 'shared', 'infra', 'db', 'schema', 'cases.ts'),
  // Schema barrel re-exports the table; reads only.
  join(ROOT, 'shared', 'infra', 'db', 'schema.ts'),
  // Schema-level smoke tests are not user code.
  join(ROOT, 'shared', 'infra', 'db', '__tests__'),
]

const FORBIDDEN_PATTERNS: RegExp[] = [
  // Direct INSERT against cases (anywhere except ops).
  /\.insert\s*\(\s*cases\b/,
  // Direct UPDATE against cases (anywhere except ops).
  /\.update\s*\(\s*cases\b/,
  // Drizzle .set({ state: ... }) on cases.
  /set\s*\(\s*\{[^}]*\bstate\s*:/m,
  // Direct property assignment to cases row state.
  /cases\.state\s*=/,
]

function* walk(dir: string): Generator<string> {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) {
      yield* walk(full)
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      yield full
    }
  }
}

function isAllowed(file: string): boolean {
  for (const allowed of ALLOWED_DIRS) {
    if (file === allowed) return true
    if (file.startsWith(allowed + '/')) return true
  }
  return false
}

describe('state-machine governance — cases.state writes are confined to @contexts/ops', () => {
  it('no source file outside @contexts/ops mutates cases.state', () => {
    const violations: Array<{ file: string; pattern: string; sample: string }> = []

    for (const file of walk(ROOT)) {
      if (isAllowed(file)) continue
      const content = readFileSync(file, 'utf8')
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = pattern.exec(content)
        if (match) {
          violations.push({
            file: relative(process.cwd(), file),
            pattern: pattern.source,
            sample: match[0],
          })
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('the case service is the only export path that imports the cases table', () => {
    const offenders: string[] = []
    for (const file of walk(ROOT)) {
      if (isAllowed(file)) continue
      const content = readFileSync(file, 'utf8')
      // Grep for direct named import of `cases` from the schema.
      const re = /from\s+['"]@shared\/infra\/db\/schema(?:\/cases)?['"]/
      if (!re.test(content)) continue
      // Even if the import line exists, it might be importing types
      // only (CaseRow). Filter out type-only imports.
      const importMatch = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@shared\/infra\/db\/schema(?:\/cases)?['"]/m.exec(
        content,
      )
      if (!importMatch) continue
      const named = importMatch[1] ?? ''
      // Reading `cases` value (not just types) outside the ops context
      // is a violation.
      if (/\bcases\b/.test(named) && !/^\s*type\b/.test(importMatch[0])) {
        offenders.push(relative(process.cwd(), file))
      }
    }
    expect(offenders).toEqual([])
  })
})
