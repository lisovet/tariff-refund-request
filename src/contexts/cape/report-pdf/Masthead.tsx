import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'

/**
 * Readiness Report masthead per PRD 03 + docs/DESIGN-LANGUAGE.md.
 *
 * Editorial-document mode of minimalist-ui: massive GT-Sectra title,
 * single hairline rule, case metadata in Berkeley-Mono tabular
 * figures on the right. No gradients, no shadows, no decorative
 * marks — the restraint IS the trust signal.
 */

export interface MastheadProps {
  readonly caseId: string
  readonly customerName: string
  readonly generatedAtIso: string
  readonly analystName: string
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  rule: '#1F1F1B',
  accent: '#B8431B',
} as const

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 42,
    color: COLORS.ink,
    letterSpacing: -0.8,
    lineHeight: 1.05,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: COLORS.ink60,
    marginBottom: 6,
  },
  accentEyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: COLORS.accent,
    marginBottom: 6,
  },
  metaBlock: {
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    color: COLORS.ink60,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginRight: 8,
    paddingTop: 1,
  },
  metaValue: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.ink,
  },
})

export function Masthead(props: MastheadProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.accentEyebrow}>Readiness Report</Text>
        <Text style={styles.title}>Submission readiness</Text>
      </View>
      <View style={styles.metaBlock}>
        <MetaRow label="Case" value={props.caseId} />
        <MetaRow label="Customer" value={props.customerName} />
        <MetaRow label="Generated" value={formatIsoForMasthead(props.generatedAtIso)} />
        <MetaRow label="Analyst" value={props.analystName} />
      </View>
    </View>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

function formatIsoForMasthead(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  // Editorial date: "2026-04-21 · 13:10 UTC". Mono font renders
  // the numerals with tabular figures (once Berkeley Mono lands).
  return (
    d.toISOString().slice(0, 10) + ' · ' + d.toISOString().slice(11, 16) + ' UTC'
  )
}
