import { describe, expect, it } from 'vitest'
import {
  ReadinessReportDoc,
  type ReadinessReportBody,
} from '../ReadinessReportDoc'
import { renderReadinessReport } from '../render'
import { FONT_FAMILIES } from '../fonts'

const FIXTURE_PROPS = {
  caseId: 'cas_test_42',
  customerName: 'Acme Imports LLC',
  generatedAtIso: '2026-04-21T13:10:00.000Z',
  analystName: 'S. Validator',
}

const FIXTURE_BODY: ReadinessReportBody = {
  totalEntries: 3,
  blockingCount: 1,
  warningCount: 1,
  infoCount: 0,
  entryRows: [
    {
      id: 'ent_a',
      entryNumber: '123-4567890-1',
      entryDate: '2024-09-01',
      importerOfRecord: 'Acme Imports LLC',
      dutyAmountUsdCents: 125_000,
      status: 'ok',
      notes: [],
    },
    {
      id: 'ent_b',
      entryNumber: '123-4567890-2',
      entryDate: '2024-09-02',
      importerOfRecord: 'Acme Imports LLC',
      dutyAmountUsdCents: 0,
      status: 'warning',
      notes: ['Low source confidence (broker-only).'],
    },
    {
      id: 'ent_c',
      entryNumber: '123-4567890-3',
      entryDate: '2024-09-03',
      importerOfRecord: 'Acme Imports LLC',
      dutyAmountUsdCents: 750_000,
      status: 'blocking',
      notes: ['Missing IOR.', 'Outside IEEPA window.'],
    },
  ],
  prerequisites: [
    { id: 'ior_on_file', label: 'IOR on file', met: true },
    { id: 'ach_on_file', label: 'ACH on file', met: false },
  ],
}

describe('ReadinessReportDoc — component tree', () => {
  it('returns a truthy React element without throwing', () => {
    const tree = ReadinessReportDoc(FIXTURE_PROPS)
    expect(tree).toBeTruthy()
  })

  it('carries the PDF-level metadata (title, author, subject) on the Document element', () => {
    const tree = ReadinessReportDoc(FIXTURE_PROPS)
    const props = tree.props as {
      title?: string
      author?: string
      subject?: string
    }
    expect(props.title).toContain('cas_test_42')
    expect(props.author).toBe('Tariff Refund Platform')
    expect(props.subject).toBe('CAPE Submission Readiness')
  })
})

describe('FONT_FAMILIES', () => {
  it('declares the three design-language roles', () => {
    expect(FONT_FAMILIES).toEqual({
      display: 'ReadinessDisplay',
      body: 'ReadinessBody',
      mono: 'ReadinessMono',
    })
  })
})

describe('renderReadinessReport — buffer output', () => {
  it('renders a non-empty PDF buffer', async () => {
    const buf = await renderReadinessReport(FIXTURE_PROPS)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)
  }, 15_000)

  it('buffer starts with the "%PDF-" magic header', async () => {
    const buf = await renderReadinessReport(FIXTURE_PROPS)
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-')
  }, 15_000)

  it('PDF metadata (title) contains the case id', async () => {
    const buf = await renderReadinessReport(FIXTURE_PROPS)
    // react-pdf writes info-dictionary strings as UTF-16BE with a BOM,
    // so the case id appears as 0xFE 0xFF 0x00 c 0x00 a 0x00 s ...
    // Build the expected byte sequence and look for it in the buffer.
    const caseId = 'cas_test_42'
    const utf16be = Buffer.alloc(caseId.length * 2)
    for (let i = 0; i < caseId.length; i += 1) {
      utf16be.writeUInt16BE(caseId.charCodeAt(i), i * 2)
    }
    expect(buf.indexOf(utf16be)).toBeGreaterThanOrEqual(0)
  }, 15_000)

  it('renders a non-empty PDF buffer when a full body is provided', async () => {
    const buf = await renderReadinessReport({
      ...FIXTURE_PROPS,
      body: FIXTURE_BODY,
    })
    expect(buf).toBeInstanceOf(Buffer)
    // Body sections add structure and content — the PDF should be
    // meaningfully larger than the masthead-only scaffold (>1.5KB).
    expect(buf.length).toBeGreaterThan(1_500)
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-')
  }, 15_000)

  it('full-body render carries the submission-control clause verbatim', () => {
    // The disclosure block is composed from smaller pure components
    // (DisclosureFooter etc.); the submission-control clause is the
    // load-bearing sentinel that MUST appear in the rendered tree.
    const tree = ReadinessReportDoc({
      ...FIXTURE_PROPS,
      body: FIXTURE_BODY,
    })
    const joined = collectTextStrings(tree as AnyNode).join(' ')
    expect(joined).toMatch(/We prepare files; you control submission\./)
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
