// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestionPrompt } from '../QuestionPrompt'
import { QUESTION_BY_ID } from '@contexts/screener'

describe('<QuestionPrompt>', () => {
  it('renders the prompt as the page <h1> in the display face', () => {
    render(
      <QuestionPrompt
        question={QUESTION_BY_ID.q1}
        index={1}
        total={10}
      />,
    )
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Did you import goods/i)
    expect(h1.className).toMatch(/font-display/)
  })

  it('shows the count indicator in mono — top-right per PRD 01', () => {
    render(
      <QuestionPrompt
        question={QUESTION_BY_ID.q3}
        index={3}
        total={10}
      />,
    )
    const indicator = screen.getByText(/Q3 ?\/ ?10/i)
    expect(indicator.className).toMatch(/font-mono/)
  })

  it('does NOT render a progress bar (PRD 01 explicitly forbids one)', () => {
    render(
      <QuestionPrompt question={QUESTION_BY_ID.q5} index={5} total={10} />,
    )
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
