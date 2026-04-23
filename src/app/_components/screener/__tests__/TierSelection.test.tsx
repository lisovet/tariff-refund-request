// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TierSelection } from '../TierSelection'

const pushSpy = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy, refresh: vi.fn() }),
}))

describe('<TierSelection>', () => {
  it('renders both tiers', () => {
    render(<TierSelection recommendedTier="audit" />)
    expect(screen.getByRole('heading', { name: /Audit/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Full Prep/ })).toBeTruthy()
  })

  it('marks the recommended tier with an aria-label + badge', () => {
    render(<TierSelection recommendedTier="full_prep" />)
    const recommended = screen.getByLabelText('Recommended')
    expect(recommended.textContent).toMatch(/Full Prep/)
    expect(recommended.textContent).toMatch(/Recommended/)
  })

  it('pays → pushes /screener/confirmation?tier=audit', () => {
    pushSpy.mockClear()
    render(<TierSelection recommendedTier="audit" />)
    const btn = screen.getByRole('button', { name: /start Audit/i })
    fireEvent.click(btn)
    expect(pushSpy).toHaveBeenCalledWith('/screener/confirmation?tier=audit')
  })

  it('pays → pushes /screener/confirmation?tier=full_prep', () => {
    pushSpy.mockClear()
    render(<TierSelection recommendedTier="audit" />)
    const btn = screen.getByRole('button', { name: /start Full Prep/i })
    fireEvent.click(btn)
    expect(pushSpy).toHaveBeenCalledWith('/screener/confirmation?tier=full_prep')
  })

  it('renders the $99 credit note', () => {
    render(<TierSelection recommendedTier="audit" />)
    expect(screen.getByText(/\$99 credits toward Full Prep/i)).toBeTruthy()
  })

  it('shows the success-fee subline on Full Prep only', () => {
    render(<TierSelection recommendedTier="audit" />)
    expect(screen.getByText(/10% of estimated refund/i)).toBeTruthy()
    expect(screen.getByText(/cap \$25,000/i)).toBeTruthy()
  })
})
