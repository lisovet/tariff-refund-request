/**
 * Screener context — public surface. Per ADR 001, callers import from
 * `@contexts/screener` (not from individual files inside).
 */

export type {
  ScreenerAnswers,
  ScreenerResult,
  Question,
  Qualification,
  Confidence,
  RecoveryPath,
  RecommendedNextStep,
  DisqualificationReason,
  Prerequisites,
  RefundEstimate,
  YesNo,
  YesNoUnknown,
  ClearancePath,
  ShipmentBand,
  DutyBand,
  GoodsCategory,
  EmailCapture,
} from './types'

export { QUESTIONS, QUESTION_BY_ID } from './questions'
export { nextQuestion, isComplete } from './branching'
export { estimateRefund, ESTIMATOR_VERSION } from './estimator'
export { computeResult, RESULT_VERSION } from './qualification'
