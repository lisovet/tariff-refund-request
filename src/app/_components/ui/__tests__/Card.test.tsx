// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('<Card>', () => {
  it('renders children inside a hairline-bordered container with no shadow', () => {
    render(
      <Card>
        <p>Body</p>
      </Card>,
    )
    const card = screen.getByText('Body').parentElement
    expect(card?.className).toMatch(/border/)
    expect(card?.className).toMatch(/rounded-card/)
    // No drop shadows per minimalist-ui.
    expect(card?.className).not.toMatch(/shadow-md|shadow-lg|shadow-xl/)
  })

  it('renders an optional title in the display face', () => {
    render(<Card title="Recovery">body</Card>)
    const heading = screen.getByRole('heading', { name: 'Recovery' })
    expect(heading.className).toMatch(/font-display/)
  })

  it('forwards aria-labelledby when title is set', () => {
    render(<Card title="Trust">body</Card>)
    const heading = screen.getByRole('heading', { name: 'Trust' })
    const card = heading.parentElement
    expect(card?.getAttribute('aria-labelledby')).toBe(heading.id)
  })
})
