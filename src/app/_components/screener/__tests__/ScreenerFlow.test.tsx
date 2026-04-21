// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ScreenerFlow } from '../ScreenerFlow'

describe('<ScreenerFlow>', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('starts on Q1', () => {
    render(<ScreenerFlow onComplete={vi.fn()} />)
    expect(screen.getByText(/Q1 ?\/ ?10/i)).toBeTruthy()
  })

  it('advances through Q1 → Q2 when q1 = yes', () => {
    render(<ScreenerFlow onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText(/Q2 ?\/ ?10/i)).toBeTruthy()
  })

  it('jumps to a disqualification result when q1 = no', () => {
    const onComplete = vi.fn()
    render(<ScreenerFlow onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(onComplete).toHaveBeenCalled()
    const [result, answers] = onComplete.mock.calls[0] ?? []
    expect(result?.qualification).toBe('disqualified')
    expect(result?.disqualificationReason).toBe('no_imports_in_window')
    // The 2-arg signature carries the answers so the parent can POST
    // them to /api/screener/complete.
    expect(answers?.q1).toBe('no')
  })

  it('persists answers to sessionStorage so a refresh resumes the flow', () => {
    const { unmount } = render(<ScreenerFlow onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText(/Q2 ?\/ ?10/i)).toBeTruthy()
    unmount()

    // Re-mount: should pick up where we left off.
    render(<ScreenerFlow onComplete={vi.fn()} />)
    expect(screen.getByText(/Q2 ?\/ ?10/i)).toBeTruthy()
  })

  it('back button takes the user one question backward', () => {
    render(<ScreenerFlow onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText(/Q2 ?\/ ?10/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByText(/Q1 ?\/ ?10/i)).toBeTruthy()
  })
})
