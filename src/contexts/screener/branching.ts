import { QUESTIONS } from './questions'
import type { Question, ScreenerAnswers } from './types'

/**
 * Branching engine. Pure (answers) → next question or null (complete).
 * Per PRD 01: branching is invisible to the user — there are only two
 * terminal-DQ shortcuts (q1=no and q3=no); otherwise we walk Q1..Q10
 * in order.
 */

export function nextQuestion(answers: ScreenerAnswers): Question | null {
  // Early DQ shortcuts.
  if (answers.q1 === 'no') return null
  if (answers.q3 === 'no') return null

  // Walk in order; return the first unanswered question.
  for (const q of QUESTIONS) {
    if (!isAnswered(answers, q.id)) return q
  }
  return null
}

export function isComplete(answers: ScreenerAnswers): boolean {
  if (answers.q1 === 'no') return true
  if (answers.q3 === 'no') return true
  return QUESTIONS.every((q) => isAnswered(answers, q.id))
}

function isAnswered(answers: ScreenerAnswers, id: Question['id']): boolean {
  const value = answers[id]
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.length > 0
  if (typeof value === 'object') {
    const o = value as unknown as Record<string, unknown>
    // q7 goods-category selection: non-empty categories array.
    if (Array.isArray(o.categories)) {
      return o.categories.length > 0
    }
    // Email-capture object: company + email both required.
    return (
      typeof o.company === 'string' &&
      o.company.length > 0 &&
      typeof o.email === 'string' &&
      o.email.length > 0
    )
  }
  return true
}
