// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SubProcessorsPage from '../page'

describe('/trust/sub-processors', () => {
  it('renders a typeset table of sub-processors', () => {
    render(<SubProcessorsPage />)
    const table = screen.getByRole('table')
    expect(table).toBeTruthy()
  })

  it('lists the v1 sub-processors per PRD 10', () => {
    render(<SubProcessorsPage />)
    // From PRD 10 §"Vendor / sub-processor list":
    const required = [
      'Railway',
      'Cloudflare R2',
      'Clerk',
      'Stripe',
      'Resend',
      'Inngest',
      'Sentry',
      'Axiom',
    ]
    for (const vendor of required) {
      expect(screen.getByText(vendor)).toBeTruthy()
    }
  })

  it('marks Phase-2 sub-processors (OCR + LLM) explicitly', () => {
    render(<SubProcessorsPage />)
    // OCR + LLM vendors are Phase-2; should be flagged so a current
    // reader does not assume they receive customer data today.
    const phaseLabels = screen.getAllByText(/Phase 2/i)
    expect(phaseLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('publishes the 14-day update commitment per PRD 10', () => {
    render(<SubProcessorsPage />)
    expect(screen.getByText(/14 days/i)).toBeTruthy()
  })
})
