import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'
import type { EntryStatus } from '../schema'

/**
 * EntryTable — a typeset entry list for the Readiness Report PDF.
 *
 * Not a web table: @react-pdf doesn't render <table>, so rows are
 * Flex rows with fixed-width cells. Numeric cells use Berkeley Mono
 * tabular figures to keep the dollar amounts aligned. Status glyphs
 * are real Unicode (●, ⚠, ✕) so accessibility tools read them as
 * text, not image pixels.
 */

export interface EntryTableRow {
  readonly id: string
  readonly entryNumber: string
  readonly entryDate: string
  readonly importerOfRecord: string
  readonly dutyAmountUsdCents: number
  readonly status: EntryStatus
  readonly notes: readonly string[]
}

export interface EntryTableProps {
  readonly rows: readonly EntryTableRow[]
}

/**
 * Canonical status glyphs used in the PDF table AND exported for
 * other surfaces (ops queue, customer web view) to stay consistent.
 * These are intentionally NOT emoji — accessibility + editorial
 * typography depend on glyphs that sit inside the body font cap
 * height.
 */
export const STATUS_GLYPHS: Readonly<Record<EntryStatus, string>> = {
  ok: '○', // ○ hollow circle
  warning: '△', // △ hollow triangle
  blocking: '×', // × multiplication sign
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  ink30: '#BDB8AD',
  rule: '#1F1F1B',
  positive: '#1D6B3C',
  warning: '#7A5A1A',
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
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
    paddingBottom: 6,
    marginBottom: 6,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.ink30,
  },
  notesRow: {
    paddingVertical: 4,
    paddingLeft: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.ink30,
  },
  headerCell: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: COLORS.ink60,
  },
  cellGlyph: {
    width: 20,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.ink,
  },
  cellGlyphPositive: {
    width: 20,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.positive,
  },
  cellGlyphWarning: {
    width: 20,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.warning,
  },
  cellGlyphBlocking: {
    width: 20,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.blocking,
  },
  cellEntry: {
    width: 110,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.ink,
  },
  cellDate: {
    width: 70,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.ink,
  },
  cellIor: {
    flexGrow: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 9,
    color: COLORS.ink,
    paddingRight: 8,
  },
  cellDuty: {
    width: 80,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.ink,
    textAlign: 'right',
  },
  note: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 8,
    color: COLORS.ink60,
    lineHeight: 1.5,
  },
  emptyState: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 9,
    color: COLORS.ink60,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
})

export function EntryTable(props: EntryTableProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Entries</Text>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, { width: 20 }]}>St</Text>
        <Text style={[styles.headerCell, { width: 110 }]}>Entry No.</Text>
        <Text style={[styles.headerCell, { width: 70 }]}>Date</Text>
        <Text style={[styles.headerCell, { flexGrow: 1 }]}>Importer of Record</Text>
        <Text style={[styles.headerCell, { width: 80, textAlign: 'right' }]}>Duty (USD)</Text>
      </View>
      {props.rows.length === 0 ? (
        <Text style={styles.emptyState}>
          No entries in this batch yet.
        </Text>
      ) : (
        props.rows.map((row) => <Row key={row.id} row={row} />)
      )}
    </View>
  )
}

function Row({ row }: { row: EntryTableRow }) {
  return (
    <View>
      <View style={styles.dataRow}>
        <Text style={glyphStyleFor(row.status)}>{STATUS_GLYPHS[row.status]}</Text>
        <Text style={styles.cellEntry}>{row.entryNumber}</Text>
        <Text style={styles.cellDate}>{row.entryDate}</Text>
        <Text style={styles.cellIor}>{row.importerOfRecord}</Text>
        <Text style={styles.cellDuty}>{formatDuty(row.dutyAmountUsdCents)}</Text>
      </View>
      {row.notes.length > 0 ? (
        <View style={styles.notesRow}>
          {row.notes.map((note, i) => (
            <Text key={`${row.id}-note-${i}`} style={styles.note}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function glyphStyleFor(status: EntryStatus) {
  if (status === 'blocking') return styles.cellGlyphBlocking
  if (status === 'warning') return styles.cellGlyphWarning
  return styles.cellGlyphPositive
}

function formatDuty(cents: number): string {
  const dollars = cents / 100
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
