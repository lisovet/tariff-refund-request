// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('<Button>', () => {
  it('renders as a button by default with the solid variant ink-on-paper styling', () => {
    render(<Button>Continue</Button>)
    const btn = screen.getByRole('button', { name: 'Continue' })
    expect(btn.className).toMatch(/bg-ink/)
    expect(btn.className).toMatch(/text-paper/)
    expect(btn.className).not.toMatch(/rounded-full/)
  })

  it('renders the magazine-underline variant as inline-styled per docs/DESIGN-LANGUAGE.md', () => {
    render(<Button variant="underline">Check eligibility</Button>)
    const btn = screen.getByRole('button', { name: 'Check eligibility' })
    expect(btn.className).toMatch(/underline/)
    expect(btn.className).toMatch(/text-accent/)
  })

  it('renders as an anchor when `as="a"` and href is provided', () => {
    render(
      <Button as="a" href="/screener">
        Start
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Start' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/screener')
  })

  it('respects `disabled` and applies aria-disabled for anchor variant', () => {
    render(
      <Button as="a" href="/x" disabled>
        Disabled link
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Disabled link' })
    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(link.getAttribute('tabindex')).toBe('-1')
  })

  it('forwards ref to the underlying element', () => {
    const refs: HTMLElement[] = []
    render(
      <Button
        ref={(el) => {
          if (el) refs.push(el)
        }}
      >
        With ref
      </Button>,
    )
    expect(refs).toHaveLength(1)
    expect(refs[0]?.tagName).toBe('BUTTON')
  })
})
