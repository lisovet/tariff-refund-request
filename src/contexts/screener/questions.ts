import type { Question } from './types'

/**
 * 10-question branching screener per PRD 01. Question metadata only —
 * branching logic + result computation live in their own modules.
 */

export const QUESTIONS: readonly Question[] = [
  {
    id: 'q1',
    prompt:
      'Did you import goods into the U.S. during the IEEPA-covered period?',
    subtitle: 'February 4, 2025 — February 23, 2026',
    kind: 'yes_no',
  },
  {
    id: 'q2',
    prompt: 'Where were the goods primarily manufactured?',
    kind: 'country',
  },
  {
    id: 'q3',
    prompt: 'Are you the Importer of Record on these shipments?',
    kind: 'yes_no',
  },
  {
    id: 'q4',
    prompt: 'Who handled customs clearance?',
    kind: 'clearance_path',
  },
  {
    id: 'q5',
    prompt: 'Approximately how many import shipments did you make?',
    kind: 'shipment_band',
  },
  {
    id: 'q6',
    prompt: 'Approximately how much did you pay in duties total?',
    kind: 'duty_band',
  },
  {
    id: 'q7',
    prompt: 'What categories of goods did you import?',
    kind: 'multi_category',
  },
  {
    id: 'q8',
    prompt: 'Have your entries been liquidated?',
    kind: 'yes_no_unknown',
  },
  {
    id: 'q9',
    prompt: 'Do you have an ACE portal account?',
    kind: 'yes_no_unknown',
  },
  {
    id: 'q10',
    prompt: 'Where should we send your results?',
    kind: 'email_capture',
  },
] as const

export const QUESTION_BY_ID: Readonly<Record<Question['id'], Question>> =
  Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Readonly<
    Record<Question['id'], Question>
  >
