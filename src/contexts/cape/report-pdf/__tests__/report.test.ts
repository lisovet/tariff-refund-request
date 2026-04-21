import { describe, expect, it } from 'vitest'
import {
  DISCLOSURE_FOOTNOTE,
  ReadinessReportDoc,
} from '../ReadinessReportDoc'
import { renderReadinessReport } from '../render'
import { FONT_FAMILIES } from '../fonts'

const FIXTURE_PROPS = {
  caseId: 'cas_test_42',
  customerName: 'Acme Imports LLC',
  generatedAtIso: '2026-04-21T13:10:00.000Z',
  analystName: 'S. Validator',
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

describe('DISCLOSURE_FOOTNOTE', () => {
  it('carries the canonical "Not legal advice" disclosure verbatim', () => {
    expect(DISCLOSURE_FOOTNOTE).toMatch(/Not legal advice/)
    expect(DISCLOSURE_FOOTNOTE).toMatch(/human-reviewed/)
    expect(DISCLOSURE_FOOTNOTE).toMatch(/prepare files/)
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
})
