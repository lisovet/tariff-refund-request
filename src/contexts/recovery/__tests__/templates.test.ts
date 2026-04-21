import { describe, expect, it } from 'vitest'
import {
  OUTREACH_KIT_TEMPLATES,
  OUTREACH_TEMPLATE_VERSION,
  renderOutreachKit,
  type OutreachKitTokens,
  type OutreachKitTemplate,
} from '../templates'
import type { RecoveryPath } from '../routing'

const SAMPLE_TOKENS: OutreachKitTokens = {
  brokerName: 'Flexport Inc.',
  importerName: 'Acme Imports LLC',
  windowStart: '2024-04-01',
  windowEnd: '2024-12-31',
}

const PATHS: RecoveryPath[] = ['broker', 'carrier', 'ace-self-export', 'mixed']

describe('OUTREACH_TEMPLATE_VERSION', () => {
  it('is a stable version string for the v1 template set', () => {
    expect(OUTREACH_TEMPLATE_VERSION).toMatch(/^v\d+(\.\d+)?$/)
  })
})

describe('OUTREACH_KIT_TEMPLATES — every path has a template', () => {
  it.each(PATHS)('has a non-empty template for %s', (path) => {
    const tpl = OUTREACH_KIT_TEMPLATES[path]
    expect(tpl).toBeDefined()
    expect(tpl.version).toBe(OUTREACH_TEMPLATE_VERSION)
    expect(tpl.subject.length).toBeGreaterThan(0)
    expect(tpl.body.length).toBeGreaterThan(0)
    expect(tpl.placeholders.length).toBeGreaterThan(0)
  })
})

describe('renderOutreachKit — token replacement', () => {
  it.each(PATHS)('replaces every {{placeholder}} for %s', (path) => {
    const result = renderOutreachKit(path, SAMPLE_TOKENS)
    expect(result.subject).not.toMatch(/\{\{[^}]+\}\}/)
    expect(result.body).not.toMatch(/\{\{[^}]+\}\}/)
  })

  it('substitutes the importerName for the broker path', () => {
    const result = renderOutreachKit('broker', SAMPLE_TOKENS)
    expect(result.body).toContain('Acme Imports LLC')
    expect(result.body).toContain('Flexport Inc.')
  })

  it('substitutes the date range for the carrier path', () => {
    const result = renderOutreachKit('carrier', SAMPLE_TOKENS)
    expect(result.body).toContain('2024-04-01')
    expect(result.body).toContain('2024-12-31')
  })

  it('returns the version header in the metadata', () => {
    const result = renderOutreachKit('ace-self-export', SAMPLE_TOKENS)
    expect(result.version).toBe(OUTREACH_TEMPLATE_VERSION)
    expect(result.path).toBe('ace-self-export')
  })

  it('throws a clear error when a required placeholder is missing', () => {
    expect(() =>
      renderOutreachKit('broker', {
        importerName: 'Acme Imports LLC',
        windowStart: '2024-04-01',
        windowEnd: '2024-12-31',
        // brokerName is REQUIRED for the broker path; intentionally omitted.
      } as OutreachKitTokens),
    ).toThrow(/missing token: brokerName/i)
  })
})

describe('renderOutreachKit — snapshot per path', () => {
  it.each(PATHS)(
    '%s renders deterministically — snapshot freezes the wording',
    (path) => {
      const result = renderOutreachKit(path, SAMPLE_TOKENS)
      expect(result).toMatchSnapshot()
    },
  )
})

describe('placeholders inventory matches body content', () => {
  it.each(PATHS)(
    'every {{placeholder}} appearing in the %s body is declared in placeholders[]',
    (path) => {
      const tpl: OutreachKitTemplate = OUTREACH_KIT_TEMPLATES[path]
      const declared = new Set<string>(tpl.placeholders as readonly string[])
      const found = new Set<string>()
      const re = /\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g
      for (const text of [tpl.subject, tpl.body]) {
        for (const match of text.matchAll(re)) {
          found.add(match[1] as string)
        }
      }
      for (const p of found) {
        expect(declared.has(p), `placeholder ${p} used but not declared`).toBe(true)
      }
    },
  )

  it.each(PATHS)(
    'every declared placeholder appears at least once in the %s body or subject',
    (path) => {
      const tpl: OutreachKitTemplate = OUTREACH_KIT_TEMPLATES[path]
      for (const p of tpl.placeholders) {
        const re = new RegExp(`\\{\\{${p}\\}\\}`)
        const usedInSubject = re.test(tpl.subject)
        const usedInBody = re.test(tpl.body)
        expect(
          usedInSubject || usedInBody,
          `declared placeholder ${p} unused in template`,
        ).toBe(true)
      }
    },
  )
})
