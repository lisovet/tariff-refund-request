import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@/shared/disclosure/constants'

/**
 * DisclosureFooter — the page-level disclosure block anchored at the
 * bottom of every Readiness Report page via `fixed`.
 *
 * Contents, verbatim per
 * `.claude/rules/disclosure-language-required.md`:
 *   - "Not legal advice" eyebrow
 *   - SUBMISSION_CONTROL_CLAUSE ("We prepare files; you control submission.")
 *   - CANONICAL_TRUST_PROMISE (the four-clause trust posture)
 *   - NOT_LEGAL_ADVICE_DISCLOSURE (the short footer disclosure)
 *
 * All four strings are real text (no images). Customers AND their
 * reviewers can extract + audit them from the PDF.
 */

export interface DisclosureFooterProps {
  /** When true, the footer renders inline (not position:absolute).
   *  Used when the footer is placed at end-of-document rather than
   *  as a per-page footer. */
  readonly inline?: boolean
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  rule: '#1F1F1B',
} as const

const styles = StyleSheet.create({
  fixed: {
    position: 'absolute',
    left: 56,
    right: 56,
    bottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    paddingTop: 10,
  },
  inline: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 6.5,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: COLORS.ink60,
    marginBottom: 6,
  },
  submission: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: COLORS.ink,
    marginBottom: 8,
  },
  promise: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 7.5,
    color: COLORS.ink,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  notLegal: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 7,
    color: COLORS.ink60,
    lineHeight: 1.45,
  },
})

export function DisclosureFooter(props: DisclosureFooterProps) {
  return (
    <View fixed={!props.inline} style={props.inline ? styles.inline : styles.fixed}>
      <Text style={styles.eyebrow}>Not legal advice</Text>
      <Text style={styles.submission}>{SUBMISSION_CONTROL_CLAUSE}</Text>
      <Text style={styles.promise}>{CANONICAL_TRUST_PROMISE}</Text>
      <Text style={styles.notLegal}>{NOT_LEGAL_ADVICE_DISCLOSURE}</Text>
    </View>
  )
}
