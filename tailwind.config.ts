import type { Config } from 'tailwindcss'

/**
 * Design tokens are the binding visual contract — see docs/DESIGN-LANGUAGE.md.
 * Colors: ink-on-paper with a single severe accent (customs-orange).
 * Typography: GT Sectra display (with serif fallbacks), Söhne body (with sans
 * fallbacks), Berkeley Mono numeric (with mono fallbacks). Custom-font
 * licenses are TODO(human-action); the fallback chain renders faithfully.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'paper-2': 'rgb(var(--paper-2) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        positive: 'rgb(var(--positive) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        blocking: 'rgb(var(--blocking) / <alpha-value>)',
      },
      fontFamily: {
        display: [
          'GT Sectra',
          'Tiempos Headline',
          'Newsreader',
          'Source Serif Pro',
          'Georgia',
          'serif',
        ],
        sans: [
          'Söhne',
          'Neue Haas Grotesk',
          'Inter Tight',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'Berkeley Mono',
          'JetBrains Mono',
          'IBM Plex Mono',
          'SF Mono',
          'ui-monospace',
          'monospace',
        ],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      letterSpacing: {
        display: '-0.02em',
      },
      borderRadius: {
        // Keep corners sharp per design language; max 4px on cards
        card: '4px',
      },
      transitionTimingFunction: {
        // Custom easing — paper settling, not a spring
        paper: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        160: '160ms',
        240: '240ms',
        480: '480ms',
      },
    },
  },
  plugins: [],
}

export default config
