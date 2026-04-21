// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Eyebrow } from '../Eyebrow'
import { Hairline } from '../Hairline'
import { Footnote } from '../Footnote'
import { KbdShortcut } from '../KbdShortcut'

describe('<Eyebrow>', () => {
  it('renders an uppercase, wide-tracked, mono label', () => {
    render(<Eyebrow>Stage 02</Eyebrow>)
    const el = screen.getByText('Stage 02')
    expect(el.className).toMatch(/uppercase/)
    expect(el.className).toMatch(/font-mono/)
    expect(el.className).toMatch(/tracking/)
  })
})

describe('<Hairline>', () => {
  it('renders an hr element with the rule color', () => {
    render(<Hairline />)
    const hr = document.querySelector('hr')
    expect(hr).not.toBeNull()
    expect(hr?.className).toMatch(/border-rule/)
  })

  it('renders a labeled chapter break when label is set', () => {
    render(<Hairline label="Section II" />)
    expect(screen.getByText('Section II')).toBeTruthy()
  })
})

describe('<Footnote>', () => {
  it('renders a real superscript reference linking to a footer block', () => {
    render(
      <p>
        Refunds may take 6–12 months
        <Footnote id="fn-1">CBP processing times vary; this is an estimate.</Footnote>
      </p>,
    )
    const sup = document.querySelector('sup')
    expect(sup).not.toBeNull()
    const link = sup?.querySelector('a')
    expect(link?.getAttribute('href')).toBe('#fn-1-content')
  })
})

describe('<KbdShortcut>', () => {
  it('renders kbd elements joined by `+` for multi-key chords', () => {
    render(<KbdShortcut keys={['Shift', 'K']} />)
    const kbds = document.querySelectorAll('kbd')
    expect(kbds).toHaveLength(2)
    expect(kbds[0]?.textContent).toBe('Shift')
    expect(kbds[1]?.textContent).toBe('K')
  })
})
