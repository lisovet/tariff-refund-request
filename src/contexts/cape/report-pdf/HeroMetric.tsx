import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'

/**
 * HeroMetric — the hero count line on the Readiness Report PDF.
 *
 * Berkeley-Mono tabular-figure count ("42 entries reviewed") flanked
 * by three small quantitative badges (blocking / warning / info). No
 * icons, no color swatches outside the state-color tokens, no
 * horizontal rules between badges — whitespace does the separation.
 */

export interface HeroMetricProps {
  readonly totalEntries: number
  readonly blockingCount: number
  readonly warningCount: number
  readonly infoCount: number
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  positive: '#1D6B3C',
  warning: '#7A5A1A',
  blocking: '#8A1F1F',
} as const

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
  },
  heroBlock: {
    flexDirection: 'column',
  },
  heroEyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: COLORS.ink60,
    marginBottom: 6,
  },
  heroCount: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 28,
    color: COLORS.ink,
    letterSpacing: -0.4,
    lineHeight: 1.05,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  badge: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 56,
  },
  badgeCount: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 18,
    color: COLORS.ink,
  },
  badgeCountBlocking: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 18,
    color: COLORS.blocking,
  },
  badgeCountWarning: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 18,
    color: COLORS.warning,
  },
  badgeCountPositive: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 18,
    color: COLORS.positive,
  },
  badgeLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: COLORS.ink60,
    marginTop: 4,
  },
})

export function HeroMetric(props: HeroMetricProps) {
  const entryNoun = props.totalEntries === 1 ? 'entry' : 'entries'
  return (
    <View style={styles.container}>
      <View style={styles.heroBlock}>
        <Text style={styles.heroEyebrow}>Batch outcome</Text>
        <Text style={styles.heroCount}>
          {props.totalEntries} {entryNoun} reviewed
        </Text>
      </View>
      <View style={styles.badgeRow}>
        <Badge
          count={props.blockingCount}
          label="Blocking"
          severity={props.blockingCount > 0 ? 'blocking' : 'positive'}
        />
        <Badge
          count={props.warningCount}
          label="Warnings"
          severity={props.warningCount > 0 ? 'warning' : 'positive'}
        />
        <Badge count={props.infoCount} label="Info" severity="neutral" />
      </View>
    </View>
  )
}

function Badge({
  count,
  label,
  severity,
}: {
  count: number
  label: string
  severity: 'blocking' | 'warning' | 'positive' | 'neutral'
}) {
  const countStyle =
    severity === 'blocking'
      ? styles.badgeCountBlocking
      : severity === 'warning'
        ? styles.badgeCountWarning
        : severity === 'positive'
          ? styles.badgeCountPositive
          : styles.badgeCount
  return (
    <View style={styles.badge}>
      <Text style={countStyle}>{count}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  )
}
