import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { FONT_FAMILIES } from './fonts'

/**
 * Numbered footnotes per the disclosure rule's "real footnotes, not
 * banners or accordions" mandate. Footnotes are real text — the PDF
 * extraction must reveal them, so they render as numbered entries
 * at the bottom of the report, preceded by bracketed markers used
 * inline (`FootnoteMarker`).
 *
 * Screen readers read "[1]" as "bracket one bracket" which is
 * acceptable editorial shorthand; avoids the U+2460 circled-digit
 * glyphs that reader voices mispronounce.
 */

export interface FootnoteItem {
  readonly id: string
  readonly body: string
}

export interface FootnotesProps {
  readonly items: readonly FootnoteItem[]
}

const COLORS = {
  ink: '#0E0E0C',
  ink60: '#5A5A58',
  rule: '#1F1F1B',
} as const

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    marginBottom: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: COLORS.ink60,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  marker: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 8,
    color: COLORS.ink60,
    width: 28,
  },
  body: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 8.5,
    color: COLORS.ink,
    lineHeight: 1.55,
    flexGrow: 1,
  },
  markerInline: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 7,
    color: COLORS.ink60,
  },
})

export function Footnotes(props: FootnotesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Notes</Text>
      {props.items.map((item, i) => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.marker}>{`[${i + 1}]`}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * Inline marker for referencing a footnote from body text. Use like:
 *   <Text>... based on the information you provided<FootnoteMarker index={1} /></Text>
 */
export function FootnoteMarker({ index }: { index: number }) {
  return <Text style={styles.markerInline}>{` [${index}]`}</Text>
}
