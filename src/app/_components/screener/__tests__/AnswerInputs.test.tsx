// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AnswerInput } from '../AnswerInput'
import type { Question } from '@contexts/screener'
import { QUESTION_BY_ID } from '@contexts/screener'

const noopBack = () => {}

describe('<AnswerInput> — yes_no', () => {
  it('emits "yes" when Yes clicked', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q1}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(submit).toHaveBeenCalledWith('yes')
  })

  it('emits "no" when No clicked', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q1}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(submit).toHaveBeenCalledWith('no')
  })
})

describe('<AnswerInput> — yes_no_unknown', () => {
  it('exposes Yes / No / I don\'t know choices', () => {
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q8}
        onSubmit={vi.fn()}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'No' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /I don.t know/i }),
    ).toBeTruthy()
  })
})

describe('<AnswerInput> — country', () => {
  it('emits the typed country', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q2}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.change(screen.getByLabelText(/country/i), {
      target: { value: 'CN' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(submit).toHaveBeenCalledWith('CN')
  })

  it('emits "unknown" when the I-do-not-know shortcut is clicked', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q2}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /I don.t know/i }))
    expect(submit).toHaveBeenCalledWith('unknown')
  })
})

describe('<AnswerInput> — duty_band', () => {
  it('renders all five canonical bands', () => {
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q6}
        onSubmit={vi.fn()}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(5)
  })
})

describe('<AnswerInput> — multi_category', () => {
  it('emits an array of selected categories on submit', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q7}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /electronics/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /apparel/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(submit).toHaveBeenCalledWith(['electronics', 'apparel'])
  })

  it('disables continue until at least one category is picked', () => {
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q7}
        onSubmit={vi.fn()}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })
})

describe('<AnswerInput> — email_capture', () => {
  it('emits company + email on submit', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q10}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Acme Imports' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'a@b.co' },
    })
    fireEvent.click(screen.getByRole('button', { name: /see my results/i }))
    expect(submit).toHaveBeenCalledWith({
      company: 'Acme Imports',
      email: 'a@b.co',
    })
  })

  it('blocks submit when email is invalid', () => {
    const submit = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q10}
        onSubmit={submit}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Acme' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: /see my results/i }))
    expect(submit).not.toHaveBeenCalled()
  })
})

describe('<AnswerInput> — back button', () => {
  it('back button is hidden on the first question', () => {
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q1}
        onSubmit={vi.fn()}
        onBack={noopBack}
        canGoBack={false}
      />,
    )
    expect(screen.queryByRole('button', { name: /previous/i })).toBeNull()
  })

  it('back button calls onBack when shown', () => {
    const back = vi.fn()
    render(
      <AnswerInput
        question={QUESTION_BY_ID.q1}
        onSubmit={vi.fn()}
        onBack={back}
        canGoBack
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(back).toHaveBeenCalled()
  })
})

const _typeCheck: Question = QUESTION_BY_ID.q1 // ensure type import is used
void _typeCheck
