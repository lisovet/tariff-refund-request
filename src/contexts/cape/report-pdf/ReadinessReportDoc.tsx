import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer'
import { Masthead, type MastheadProps } from './Masthead'
import { HeroMetric } from './HeroMetric'
import { EntryTable, type EntryTableRow } from './EntryTable'
import { PrerequisitesList } from './PrerequisitesList'
import { FONT_FAMILIES, registerReadinessFonts } from './fonts'
import type { PrerequisiteCheck } from '../schema'

/**
 * Readiness Report PDF document — masthead + hero metric + entry
 * table + prerequisites checklist (tasks #67 + #68). Downstream
 * tasks add the analyst sign-off block (#69) and artifact storage
 * (#70).
 *
 * `body` carries the data the body sections need. It's optional so
 * callers that only want the masthead (e.g. legacy #67 tests) still
 * render. When omitted, the body renders a placeholder sentence.
 */

export interface ReadinessReportBody {
  readonly totalEntries: number
  readonly blockingCount: number
  readonly warningCount: number
  readonly infoCount: number
  readonly entryRows: readonly EntryTableRow[]
  readonly prerequisites: readonly PrerequisiteCheck[]
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
    paddingBottom: 64,
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
  footer: {
    position: 'absolute',
    left: 56,
    right: 56,
    bottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink,
    paddingTop: 10,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    color: COLORS.ink70,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
})

/**
 * Canonical disclosure footer — verbatim match to the product's
 * disclosure rule. Appears on every rendered Readiness Report so
 * the PDF carries the same "Not legal advice" footing as every
 * other customer-facing surface.
 */
const DISCLOSURE_FOOTNOTE =
  'Not legal advice. We prepare files; you control submission. Every artifact has been human-reviewed before reaching you.'

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
          </>
        ) : (
          <Text style={styles.placeholder}>
            {props.bodyPlaceholder ??
              'Summary tiles, entry table, prerequisites checklist, and analyst sign-off block render here in subsequent iterations.'}
          </Text>
        )}
        <Text fixed style={styles.footer}>
          {DISCLOSURE_FOOTNOTE}
        </Text>
      </Page>
    </Document>
  )
}

export { DISCLOSURE_FOOTNOTE }
