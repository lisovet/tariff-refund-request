import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'

/**
 * SignOffBlock — the analyst reviewing-attribution block per
 * `.claude/rules/disclosure-language-required.md`:
 *
 * > Readiness Report and submission-ready state always names the
 * > validator and timestamp.
 *
 * Renders above the disclosure footer so the customer can see who
 * signed off on the batch, when, and a short note explaining the
 * review. A Readiness Report WITHOUT this block is, by product
 * rule, not "submission-ready."
 */

export interface SignOffBlockProps {
  readonly analystName: string
  readonly signedAtIso: string
  readonly note: string
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  rule: '#1F1F1B',
  paper: '#ECE7DA',
} as const

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: COLORS.ink60,
    marginBottom: 10,
  },
  attribution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  name: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 14,
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  timestamp: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.ink60,
    paddingTop: 4,
  },
  note: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.55,
  },
  missingNote: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 9,
    fontStyle: 'italic',
    color: COLORS.ink60,
  },
})

export function SignOffBlock(props: SignOffBlockProps) {
  const hasNote = props.note.trim().length > 0
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Reviewed &amp; signed</Text>
      <View style={styles.attribution}>
        <Text style={styles.name}>{props.analystName}</Text>
        <Text style={styles.timestamp}>
          {formatIsoForSignoff(props.signedAtIso)}
        </Text>
      </View>
      {hasNote ? (
        <Text style={styles.note}>{props.note}</Text>
      ) : (
        <Text style={styles.missingNote}>No reviewer note recorded.</Text>
      )}
    </View>
  )
}

function formatIsoForSignoff(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(0, 10) + ' · ' + d.toISOString().slice(11, 16) + ' UTC'
}
