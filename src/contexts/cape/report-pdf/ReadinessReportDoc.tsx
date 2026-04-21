import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer'
import { Masthead, type MastheadProps } from './Masthead'
import { HeroMetric } from './HeroMetric'
import { EntryTable, type EntryTableRow } from './EntryTable'
import { PrerequisitesList } from './PrerequisitesList'
import { SignOffBlock, type SignOffBlockProps } from './SignOffBlock'
import { Footnotes, type FootnoteItem } from './Footnotes'
import { DisclosureFooter } from './DisclosureFooter'
import { FONT_FAMILIES, registerReadinessFonts } from './fonts'
import { SUBMISSION_CONTROL_CLAUSE } from '@/shared/disclosure/constants'
import type { PrerequisiteCheck } from '../schema'

/**
 * Readiness Report PDF document — masthead + hero metric + entry
 * table + prerequisites checklist + analyst sign-off + footnotes
 * (tasks #67, #68, #69). Task #70 wires artifact storage to this
 * document.
 *
 * `body` carries the data the body sections need. It's optional so
 * callers that only want the masthead (e.g. legacy smoke tests)
 * still render. When omitted, the body renders a placeholder
 * sentence.
 */

export interface ReadinessReportBody {
  readonly totalEntries: number
  readonly blockingCount: number
  readonly warningCount: number
  readonly infoCount: number
  readonly entryRows: readonly EntryTableRow[]
  readonly prerequisites: readonly PrerequisiteCheck[]
  readonly signoff?: SignOffBlockProps
  readonly footnotes?: readonly FootnoteItem[]
}

export interface ReadinessReportDocProps extends MastheadProps {
  /** Optional body-section payload. When omitted, a placeholder
   *  sentence renders in place of the hero metric + entry table +
   *  prerequisites stack. */
  readonly body?: ReadinessReportBody
  /** Optional body text under the masthead — overrides the default
   *  placeholder when `body` is also omitted. Used by task #67-era
   *  smoke tests. */
  readonly bodyPlaceholder?: string
}

const COLORS = {
  ink: '#0E0E0C',
  paper: '#F4F1EA',
  ink70: '#3F3F3D',
} as const

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    paddingTop: 48,
    paddingBottom: 140,
    paddingHorizontal: 56,
    fontFamily: FONT_FAMILIES.body,
    color: COLORS.ink,
    fontSize: 10,
    lineHeight: 1.55,
  },
  placeholder: {
    marginTop: 24,
    fontFamily: FONT_FAMILIES.body,
    color: COLORS.ink70,
    fontSize: 10,
  },
})

/**
 * Short disclosure footnote preserved for backwards compatibility
 * with task #67-era tests. The full, multi-line disclosure block is
 * rendered by `DisclosureFooter` via `CANONICAL_TRUST_PROMISE` +
 * siblings (see `src/shared/disclosure/constants.ts`).
 */
const DISCLOSURE_FOOTNOTE = `Not legal advice. ${SUBMISSION_CONTROL_CLAUSE} Every artifact has been human-reviewed before reaching you.`

export function ReadinessReportDoc(props: ReadinessReportDocProps) {
  registerReadinessFonts()
  const { body } = props
  return (
    <Document
      title={`Readiness Report — ${props.caseId}`}
      author="Tariff Refund Platform"
      subject="CAPE Submission Readiness"
      producer="@react-pdf/renderer"
    >
      <Page size="LETTER" style={styles.page}>
        <Masthead {...props} />
        {body ? (
          <>
            <HeroMetric
              totalEntries={body.totalEntries}
              blockingCount={body.blockingCount}
              warningCount={body.warningCount}
              infoCount={body.infoCount}
            />
            <EntryTable rows={body.entryRows} />
            <PrerequisitesList prerequisites={body.prerequisites} />
            {body.signoff ? <SignOffBlock {...body.signoff} /> : null}
            {body.footnotes && body.footnotes.length > 0 ? (
              <Footnotes items={body.footnotes} />
            ) : null}
          </>
        ) : (
          <Text style={styles.placeholder}>
            {props.bodyPlaceholder ??
              'Summary tiles, entry table, prerequisites checklist, and analyst sign-off block render here in subsequent iterations.'}
          </Text>
        )}
        <DisclosureFooter />
      </Page>
    </Document>
  )
}

export { DISCLOSURE_FOOTNOTE }
