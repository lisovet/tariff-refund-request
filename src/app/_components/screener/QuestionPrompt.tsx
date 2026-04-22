import type { Question } from '@contexts/screener'

/**
 * The question header. Per PRD 01 + docs/DESIGN-LANGUAGE.md:
 *
 * - Question is the page <h1>, set in GT Sectra display.
 * - Small mono `Q3 / 10` indicator sits ABOVE the headline (not
 *   absolutely positioned — previous float-right collided with the
 *   headline's last word on wrap). No progress bar: a bar implies
 *   a transactional sprint; this is consultative.
 * - Generous spacing; the question carries the page.
 */

interface Props {
  readonly question: Question
  readonly index: number // 1-based position in the flow
  readonly total: number
}

export function QuestionPrompt({ question, index, total }: Props) {
  return (
    <header>
      <p
        className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-ink/60"
        aria-label={`Question ${index} of ${total}`}
      >
        Q{index} / {total}
      </p>
      <h1 className="font-display text-3xl tracking-display text-ink sm:text-5xl">
        {question.prompt}
      </h1>
      {question.subtitle && (
        <p className="mt-4 font-mono text-sm uppercase tracking-[0.2em] text-accent">
          {question.subtitle}
        </p>
      )}
    </header>
  )
}
