import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'
import type { PrerequisiteCheck } from '../schema'

/**
 * PrerequisitesList — the IOR / ACH / ACE checklist rendered under
 * the entry table. A prerequisite that is NOT met is surfaced here
 * so the customer knows exactly what must be resolved before filing;
 * the same checklist drives the analyst's UI in the ops workspace.
 *
 * Labels come from the validator; this component is pure
 * presentation.
 */

export interface PrerequisitesListProps {
  readonly prerequisites: readonly PrerequisiteCheck[]
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  rule: '#1F1F1B',
  positive: '#1D6B3C',
  blocking: '#8A1F1F',
} as const

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: COLORS.ink60,
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#BDB8AD',
  },
  marker: {
    width: 20,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
  },
  markerMet: {
    color: COLORS.positive,
  },
  markerMissing: {
    color: COLORS.blocking,
  },
  label: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 9.5,
    color: COLORS.ink,
    flexGrow: 1,
  },
  status: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: COLORS.ink60,
    width: 80,
    textAlign: 'right',
  },
  emptyState: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 9,
    color: COLORS.ink60,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
})

/**
 * Editorial "met / missing" glyphs. Same no-emoji rule as
 * {@link STATUS_GLYPHS}.
 */
const PREREQUISITE_GLYPHS = {
  met: '✓',
  missing: '✕',
} as const

export function PrerequisitesList(props: PrerequisitesListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Prerequisites</Text>
      {props.prerequisites.length === 0 ? (
        <Text style={styles.emptyState}>
          No prerequisites required for this batch.
        </Text>
      ) : (
        props.prerequisites.map((p) => (
          <View key={p.id} style={styles.item}>
            <Text
              style={[
                styles.marker,
                p.met ? styles.markerMet : styles.markerMissing,
              ]}
            >
              {p.met ? PREREQUISITE_GLYPHS.met : PREREQUISITE_GLYPHS.missing}
            </Text>
            <Text style={styles.label}>{p.label}</Text>
            <Text style={styles.status}>{p.met ? 'Met' : 'Missing'}</Text>
          </View>
        ))
      )}
    </View>
  )
}
