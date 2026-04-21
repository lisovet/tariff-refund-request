// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBanner } from '../StatusBanner'

describe('<StatusBanner>', () => {
  it('renders case id in mono with status + next-action link', () => {
    render(
      <StatusBanner
        caseId="2026-04-1138"
        status="ENTRY LIST READY"
        nextAction={{ label: 'Review your entry list', href: '/app/case/abc' }}
      />,
    )
    expect(screen.getByText('2026-04-1138').className).toMatch(/font-mono/)
    expect(screen.getByText('ENTRY LIST READY')).toBeTruthy()
    const link = screen.getByRole('link', { name: /Review your entry list/i })
    expect(link.getAttribute('href')).toBe('/app/case/abc')
  })

  it('uses semantic banner role so screen readers announce it as a region', () => {
    render(
      <StatusBanner
        caseId="2026-04-0001"
        status="NEW"
        nextAction={{ label: 'x', href: '/x' }}
      />,
    )
    expect(screen.getByRole('region', { name: /case status/i })).toBeTruthy()
  })

  it('renders status in the accent color when severity is set', () => {
    render(
      <StatusBanner
        caseId="2026-04-0001"
        status="DEFICIENT"
        severity="blocking"
        nextAction={{ label: 'x', href: '/x' }}
      />,
    )
    const status = screen.getByText('DEFICIENT')
    expect(status.className).toMatch(/text-blocking/)
  })
})
