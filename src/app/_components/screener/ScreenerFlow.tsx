'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  computeResult,
  isComplete,
  nextQuestion,
  QUESTIONS,
  type ScreenerAnswers,
  type ScreenerResult,
} from '@contexts/screener'
import { AnswerInput } from './AnswerInput'
import { QuestionPrompt } from './QuestionPrompt'

/**
 * Orchestrates the one-question-per-screen flow per PRD 01.
 *
 * State machine:
 *   answers (partial ScreenerAnswers) is the source of truth.
 *   Persisted to sessionStorage on every change so a refresh resumes.
 *   onComplete fires the moment isComplete(answers) becomes true.
 */

const STORAGE_KEY = 'tariff-refund:screener:v1'

interface Props {
  readonly onComplete: (result: ScreenerResult) => void
}

export function ScreenerFlow({ onComplete }: Props) {
  const [answers, setAnswers] = useState<ScreenerAnswers>(() => loadAnswers())

  // Persist on every change.
  useEffect(() => {
    saveAnswers(answers)
  }, [answers])

  // Fire onComplete the moment the flow terminates.
  useEffect(() => {
    if (isComplete(answers)) onComplete(computeResult(answers))
  }, [answers, onComplete])

  const current = useMemo(() => nextQuestion(answers), [answers])
  const totalQuestions = QUESTIONS.length
  const indexOfCurrent = useMemo(() => {
    if (!current) return totalQuestions
    return QUESTIONS.findIndex((q) => q.id === current.id) + 1
  }, [current, totalQuestions])

  if (!current) {
    return null // parent renders the result page
  }

  const answeredIds = QUESTIONS.filter((q) =>
    Object.prototype.hasOwnProperty.call(answers, q.id),
  ).map((q) => q.id)
  const canGoBack = answeredIds.length > 0

  function handleSubmit(value: unknown) {
    setAnswers((prev) => ({ ...prev, [current!.id]: value }))
  }

  function handleBack() {
    if (answeredIds.length === 0) return
    const last = answeredIds[answeredIds.length - 1]
    if (!last) return
    setAnswers((prev) => {
      const copy = { ...prev }
      delete copy[last]
      return copy
    })
  }

  return (
    <div>
      <QuestionPrompt
        question={current}
        index={indexOfCurrent}
        total={totalQuestions}
      />
      <AnswerInput
        question={current}
        onSubmit={handleSubmit}
        onBack={handleBack}
        canGoBack={canGoBack}
      />
    </div>
  )
}

// --- persistence ----------------------------------------------------------

function loadAnswers(): ScreenerAnswers {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as ScreenerAnswers)
      : {}
  } catch {
    return {}
  }
}

function saveAnswers(answers: ScreenerAnswers): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // Quota or disabled storage — ignore; in-session memory state is enough.
  }
}

export function clearScreenerSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
