// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LegalRequestsPage from '../page'

describe('/trust/legal-requests', () => {
  it('renders the editorial H1 in the display face', () => {
    render(<LegalRequestsPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/how we handle legal requests/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('renders the five-step process block', () => {
    render(<LegalRequestsPage />)
    expect(screen.getByText(/Step 01/)).toBeTruthy()
    expect(screen.getByText(/Step 05/)).toBeTruthy()
    expect(screen.getByText(/customer notified/i)).toBeTruthy()
  })

  it('renders the data-categories table including the 7-year CBP retention', () => {
    render(<LegalRequestsPage />)
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getAllByText(/7 years/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Audit log/).length).toBeGreaterThan(0)
  })

  it('links to the sub-processors list (downstream request handling)', () => {
    render(<LegalRequestsPage />)
    const links = screen
      .getAllByRole('link')
      .map((l) => l.getAttribute('href') ?? '')
    expect(links).toContain('/trust/sub-processors')
  })

  it('names the legal contact address consistent with EMAIL_FROM domain', () => {
    render(<LegalRequestsPage />)
    expect(screen.getByText(/legal@tariffrefundrequest\.com/i)).toBeTruthy()
  })

  it('surfaces the "not legal advice" non-goal verbatim', () => {
    render(<LegalRequestsPage />)
    expect(
      screen.getByText(/not legal advice/i),
    ).toBeTruthy()
  })
})
