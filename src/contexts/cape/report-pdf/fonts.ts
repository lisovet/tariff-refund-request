import { Font } from '@react-pdf/renderer'

/**
 * Readiness Report font registration per docs/DESIGN-LANGUAGE.md.
 *
 * The design language mandates:
 *   - Display: GT Sectra (serif, editorial).
 *   - Body:    Söhne (sans-serif, warm geometric).
 *   - Numeric: Berkeley Mono (tabular figures for entry numbers,
 *              duty values, timestamps).
 *
 * v1 ships with the three built-in PDF font families as fallbacks
 * (Times-Roman, Helvetica, Courier). TODO(human-action): license +
 * self-host the real fonts and register their .ttf URLs here. Once
 * licensed, the snapshot tests and the PDF's visual identity both
 * align with the rest of the product surfaces.
 */

export const FONT_FAMILIES = {
  display: 'ReadinessDisplay',
  body: 'ReadinessBody',
  mono: 'ReadinessMono',
} as const

let registered = false

export function registerReadinessFonts(): void {
  if (registered) return
  // Built-in PDF families — always available; no network fetch.
  // @react-pdf/renderer treats these as aliases so a missing .ttf
  // doesn't throw at render time. When the real fonts land,
  // replace the `src` entries with the licensed .ttf URLs.
  Font.register({
    family: FONT_FAMILIES.display,
    fonts: [
      { src: 'Times-Roman' as unknown as string },
      { src: 'Times-Bold' as unknown as string, fontWeight: 'bold' },
    ],
  })
  Font.register({
    family: FONT_FAMILIES.body,
    fonts: [
      { src: 'Helvetica' as unknown as string },
      { src: 'Helvetica-Bold' as unknown as string, fontWeight: 'bold' },
    ],
  })
  Font.register({
    family: FONT_FAMILIES.mono,
    fonts: [{ src: 'Courier' as unknown as string }],
  })
  registered = true
}

/**
 * For tests that want to reset the global registration state between
 * runs (vitest isolates modules per test file but not within a file).
 */
export function _resetFontRegistration(): void {
  registered = false
}
