// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SecurityPage from '../page'

describe('/trust/security', () => {
  it('renders a top-level heading describing the page', () => {
    render(<SecurityPage />)
    // The h1 reads "How we secure your data." — match on that phrase
    // rather than "security" (which also matches the eyebrow).
    expect(
      screen.getByRole('heading', { level: 1, name: /secure your data/i }),
    ).toBeTruthy()
  })

  it('documents the four security sections called out in PRD 10 §Security posture', () => {
    render(<SecurityPage />)
    expect(screen.getByRole('heading', { name: /authentication/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /storage & encryption/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /retention/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /access control/i })).toBeTruthy()
  })

  it('names the 15-minute upload URL expiry as a real-text detail', () => {
    render(<SecurityPage />)
    expect(screen.getByText(/15 minutes/i)).toBeTruthy()
  })

  it('names Clerk as the auth provider + mentions MFA', () => {
    render(<SecurityPage />)
    expect(screen.getAllByText(/Clerk/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/MFA|multi-factor/i)).toBeTruthy()
  })

  it('mentions at-rest encryption for Postgres + R2', () => {
    render(<SecurityPage />)
    expect(screen.getAllByText(/at rest/i).length).toBeGreaterThan(0)
  })

  it('lists the least-privilege staff roles (coordinator, analyst, validator, admin)', () => {
    render(<SecurityPage />)
    expect(screen.getAllByText(/coordinator/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/analyst/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/validator/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0)
  })

  it('links to the full sub-processors list', () => {
    render(<SecurityPage />)
    const link = screen.getByRole('link', { name: /sub-processors/i })
    expect(link.getAttribute('href')).toBe('/trust/sub-processors')
  })

  it('renders the incident response section (response time expectations)', () => {
    render(<SecurityPage />)
    expect(screen.getByRole('heading', { name: /incident response/i })).toBeTruthy()
    expect(screen.getByText(/72 hours/i)).toBeTruthy()
  })

  it('states v1 sub-processors count (reads from the shared list — no drift)', () => {
    render(<SecurityPage />)
    // The page renders a summary count — exact number comes from the
    // shared list so drift would fail the sub-processors unit tests
    // + this render.
    expect(screen.getByText(/8 active sub-processors/i)).toBeTruthy()
  })
})
