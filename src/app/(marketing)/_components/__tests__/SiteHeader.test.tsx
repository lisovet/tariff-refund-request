// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteHeader } from '../SiteHeader'

describe('SiteHeader', () => {
  it('renders the brand wordmark linking home', () => {
    render(<SiteHeader />)
    const brand = screen.getByRole('link', { name: /tariff refund/i })
    expect(brand.getAttribute('href')).toBe('/')
  })

  it('renders the three primary nav links', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: /how it works/i }).getAttribute('href')).toBe(
      '/how-it-works',
    )
    expect(screen.getByRole('link', { name: /pricing/i }).getAttribute('href')).toBe(
      '/pricing',
    )
    expect(screen.getByRole('link', { name: /trust/i }).getAttribute('href')).toBe(
      '/trust',
    )
  })

  it('renders the sign-in link', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: /sign in/i }).getAttribute('href')).toBe(
      '/sign-in',
    )
  })

  it('renders the primary CTA — Check eligibility', () => {
    render(<SiteHeader />)
    const cta = screen.getByRole('link', { name: /check eligibility/i })
    expect(cta.getAttribute('href')).toBe('/screener')
  })

  it('uses a banner landmark so screen readers recognize the masthead', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('banner')).toBeTruthy()
  })
})
