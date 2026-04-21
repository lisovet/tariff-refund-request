// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShortcutOverlay, OPS_SHORTCUTS } from '../ShortcutOverlay'

describe('OPS_SHORTCUTS', () => {
  it('exposes at least the v1 must-have bindings', () => {
    const keys = OPS_SHORTCUTS.map((s) => s.keys.join(' '))
    // Bindings referenced by the case header action panel (see
    // CaseHeaderPanel.tsx) + the queue page filter chips.
    expect(keys).toEqual(expect.arrayContaining(['c', 'x', 'g q', '?']))
  })

  it('every shortcut carries a human label + a scope', () => {
    for (const s of OPS_SHORTCUTS) {
      expect(s.description.length).toBeGreaterThan(0)
      expect(s.scope.length).toBeGreaterThan(0)
      expect(s.keys.length).toBeGreaterThan(0)
    }
  })
})

describe('ShortcutOverlay', () => {
  it('does not render the dialog by default', () => {
    render(<ShortcutOverlay />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens when the "?" key is pressed', () => {
    render(<ShortcutOverlay />)
    fireEvent.keyDown(window, { key: '?', shiftKey: true })
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeTruthy()
  })

  it('announces aria-modal on the dialog (accessibility)', () => {
    render(<ShortcutOverlay />)
    fireEvent.keyDown(window, { key: '?', shiftKey: true })
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('renders every OPS_SHORTCUTS row when open', () => {
    render(<ShortcutOverlay />)
    fireEvent.keyDown(window, { key: '?', shiftKey: true })
    for (const s of OPS_SHORTCUTS) {
      expect(screen.getByText(s.description)).toBeTruthy()
    }
  })

  it('closes on Escape', () => {
    render(<ShortcutOverlay />)
    fireEvent.keyDown(window, { key: '?', shiftKey: true })
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when the close button is clicked', () => {
    render(<ShortcutOverlay />)
    fireEvent.keyDown(window, { key: '?', shiftKey: true })
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does NOT open when typing in a text input (ignore shortcuts during text entry)', () => {
    render(
      <div>
        <input data-testid="t" />
        <ShortcutOverlay />
      </div>,
    )
    const input = screen.getByTestId('t')
    input.focus()
    fireEvent.keyDown(input, { key: '?', shiftKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
