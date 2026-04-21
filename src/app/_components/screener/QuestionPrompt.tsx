import type { Question } from '@contexts/screener'

/**
 * The question header. Per PRD 01 + docs/DESIGN-LANGUAGE.md:
 *
 * - Question is the page <h1>, set in GT Sectra display.
 * - Top-right small mono `Q3 / 10` indicator (no progress bar — a bar
 *   implies a transactional sprint; this is consultative).
 * - Generous spacing; the question carries the page.
 */

interface Props {
  readonly question: Question
  readonly index: number // 1-based position in the flow
  readonly total: number
}

export function QuestionPrompt({ question, index, total }: Props) {
  return (
    <header className="relative">
      <span
        className="absolute right-0 top-0 font-mono text-xs uppercase tracking-[0.2em] text-ink/60"
        aria-label={`Question ${index} of ${total}`}
      >
        Q{index} / {total}
      </span>
      <h1 className="font-display text-3xl tracking-display text-ink sm:text-5xl">
        {question.prompt}
      </h1>
    </header>
  )
}
