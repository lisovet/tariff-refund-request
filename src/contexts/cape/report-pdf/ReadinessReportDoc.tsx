import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer'
import { Masthead, type MastheadProps } from './Masthead'
import { FONT_FAMILIES, registerReadinessFonts } from './fonts'

/**
 * Readiness Report PDF document — v1 masthead scaffold per task #67.
 *
 * Downstream tasks (#68+) add the summary tiles, per-entry table,
 * prerequisite checklist, analyst sign-off block, and canonical
 * disclosure footnote. This iteration ships the masthead + the
 * outer document frame so a human-walk render test passes.
 */

export interface ReadinessReportDocProps extends MastheadProps {
  /** Optional body text under the masthead — used by v1 for a simple
   *  "report body renders in #68" placeholder the tests can assert. */
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
  return (
    <Document
      title={`Readiness Report — ${props.caseId}`}
      author="Tariff Refund Platform"
      subject="CAPE Submission Readiness"
      producer="@react-pdf/renderer"
    >
      <Page size="LETTER" style={styles.page}>
        <Masthead {...props} />
        <Text style={styles.placeholder}>
          {props.bodyPlaceholder ??
            'Summary tiles, entry table, prerequisites checklist, and analyst sign-off block render here in subsequent iterations.'}
        </Text>
        <Text fixed style={styles.footer}>
          {DISCLOSURE_FOOTNOTE}
        </Text>
      </Page>
    </Document>
  )
}

export { DISCLOSURE_FOOTNOTE }
