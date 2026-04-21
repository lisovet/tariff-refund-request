import { describe, expect, it } from 'vitest'
import {
  SignOffBlock,
  type SignOffBlockProps,
} from '../SignOffBlock'
import {
  Footnotes,
  FootnoteMarker,
  type FootnoteItem,
} from '../Footnotes'
import { DisclosureFooter } from '../DisclosureFooter'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@/shared/disclosure/constants'
import { ReadinessReportDoc, type ReadinessReportBody } from '../ReadinessReportDoc'
import { renderReadinessReport } from '../render'

const SIGNOFF_PROPS: SignOffBlockProps = {
  analystName: 'S. Validator',
  signedAtIso: '2026-04-21T13:10:00.000Z',
  note: 'Verified entries against source documents; ACH missing is disclosed to customer.',
}

const FOOTNOTES: FootnoteItem[] = [
  {
    id: 'fn_basis',
    body: 'Estimates are based on the information you provided.',
  },
  {
    id: 'fn_timing',
    body: 'Refund timing depends on CBP review.',
  },
]

describe('SignOffBlock', () => {
  it('returns a truthy React element', () => {
    expect(SignOffBlock(SIGNOFF_PROPS)).toBeTruthy()
  })

  it('renders the analyst name verbatim in its children', () => {
    const tree = SignOffBlock(SIGNOFF_PROPS)
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => t.includes('S. Validator'))).toBe(true)
  })

  it('renders a human-readable signed-at stamp that carries the date', () => {
    const tree = SignOffBlock(SIGNOFF_PROPS)
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => t.includes('2026-04-21'))).toBe(true)
  })

  it('renders the analyst note', () => {
    const tree = SignOffBlock(SIGNOFF_PROPS)
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => t.includes('Verified entries against source documents'))).toBe(true)
  })

  it('accepts an empty note without throwing', () => {
    expect(SignOffBlock({ ...SIGNOFF_PROPS, note: '' })).toBeTruthy()
  })
})

describe('FootnoteMarker', () => {
  it('renders the numeric marker wrapped in square brackets', () => {
    const tree = FootnoteMarker({ index: 1 })
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => /\[1\]/.test(t))).toBe(true)
  })

  it('handles multi-digit indices (footnote numbering does not break past 9)', () => {
    const tree = FootnoteMarker({ index: 12 })
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => /\[12\]/.test(t))).toBe(true)
  })
})

describe('Footnotes', () => {
  it('returns a truthy element for a non-empty list', () => {
    expect(Footnotes({ items: FOOTNOTES })).toBeTruthy()
  })

  it('renders every footnote body verbatim (strings are product language)', () => {
    const tree = Footnotes({ items: FOOTNOTES })
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => t.includes('Estimates are based on the information you provided.'))).toBe(true)
    expect(texts.some((t) => t.includes('Refund timing depends on CBP review.'))).toBe(true)
  })

  it('renders numbered markers [1], [2], ... in order', () => {
    const tree = Footnotes({ items: FOOTNOTES })
    const texts = collectTextStrings(tree as AnyNode)
    const joined = texts.join(' ')
    expect(joined).toMatch(/\[1\]/)
    expect(joined).toMatch(/\[2\]/)
    expect(joined.indexOf('[1]')).toBeLessThan(joined.indexOf('[2]'))
  })

  it('handles an empty items list without throwing', () => {
    expect(Footnotes({ items: [] })).toBeTruthy()
  })
})

describe('DisclosureFooter', () => {
  it('renders the CANONICAL_TRUST_PROMISE verbatim', () => {
    const tree = DisclosureFooter({})
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => t.includes(CANONICAL_TRUST_PROMISE))).toBe(true)
  })

  it('renders the SUBMISSION_CONTROL_CLAUSE verbatim', () => {
    const tree = DisclosureFooter({})
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => t.includes(SUBMISSION_CONTROL_CLAUSE))).toBe(true)
  })

  it('renders the "Not legal advice" eyebrow', () => {
    const tree = DisclosureFooter({})
    const texts = collectTextStrings(tree as AnyNode)
    expect(texts.some((t) => /not legal advice/i.test(t))).toBe(true)
  })
})

describe('ReadinessReportDoc — full integration with sign-off + footnotes + disclosures', () => {
  const BODY: ReadinessReportBody = {
    totalEntries: 2,
    blockingCount: 0,
    warningCount: 0,
    infoCount: 0,
    entryRows: [
      {
        id: 'ent_x',
        entryNumber: '123-4567890-1',
        entryDate: '2024-09-01',
        importerOfRecord: 'Acme Imports LLC',
        dutyAmountUsdCents: 125_000,
        status: 'ok',
        notes: [],
      },
      {
        id: 'ent_y',
        entryNumber: '123-4567890-2',
        entryDate: '2024-09-02',
        importerOfRecord: 'Acme Imports LLC',
        dutyAmountUsdCents: 225_000,
        status: 'ok',
        notes: [],
      },
    ],
    prerequisites: [{ id: 'ior_on_file', label: 'IOR on file', met: true }],
    signoff: SIGNOFF_PROPS,
    footnotes: FOOTNOTES,
  }

  it('renders a buffer containing the fully disclosed footer', async () => {
    const buf = await renderReadinessReport({
      caseId: 'cas_full_1',
      customerName: 'Acme Imports LLC',
      generatedAtIso: '2026-04-21T13:10:00.000Z',
      analystName: 'S. Validator',
      body: BODY,
    })
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(2_000)
  }, 15_000)

  it('tree-walk finds the canonical trust promise AND the sign-off verbatim', () => {
    const tree = ReadinessReportDoc({
      caseId: 'cas_full_1',
      customerName: 'Acme Imports LLC',
      generatedAtIso: '2026-04-21T13:10:00.000Z',
      analystName: 'S. Validator',
      body: BODY,
    })
    const texts = collectTextStrings(tree as AnyNode)
    const joined = texts.join(' ')
    expect(joined).toContain(CANONICAL_TRUST_PROMISE)
    expect(joined).toContain(SUBMISSION_CONTROL_CLAUSE)
    expect(joined).toMatch(/not legal advice/i)
    expect(joined).toContain('S. Validator')
    expect(joined).toContain('2026-04-21')
    expect(joined).toContain(NOT_LEGAL_ADVICE_DISCLOSURE.split('.')[0] ?? '—')
  })
})

type AnyNode =
  | {
      readonly type?: unknown
      readonly props?: { readonly children?: unknown } & Record<string, unknown>
    }
  | string
  | number
  | null
  | undefined

/**
 * React-pdf primitives (Text / View / Page / Document) expose their
 * children via `props.children`, but function-components are lazy —
 * React does not invoke them until render. So to read the FULL tree
 * of strings in a report we call any function-component we meet,
 * passing its props. Every component in this module is pure (no
 * hooks, no context), so direct invocation is safe.
 */
function collectTextStrings(node: AnyNode): string[] {
  if (node == null) return []
  if (typeof node === 'string') return [node]
  if (typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectTextStrings as (n: AnyNode) => string[])
  if (typeof node !== 'object') return []
  const type = (node as { type?: unknown }).type
  const props = (node as { props?: unknown }).props
  if (typeof type === 'function') {
    const fn = type as (p: unknown) => AnyNode
    return collectTextStrings(fn(props ?? {}))
  }
  if (!props || typeof props !== 'object') return []
  return collectTextStrings(
    (props as { children?: unknown }).children as AnyNode,
  )
}
