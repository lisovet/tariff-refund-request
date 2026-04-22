/**
 * Screener context — public surface (UI-safe).
 *
 * Per ADR 001, callers import from `@contexts/screener`. This module
 * deliberately exports ONLY pure helpers + types so it can be pulled
 * into client bundles without dragging in node:crypto / postgres-js.
 *
 * The repo factory + Drizzle implementation live in
 * `@contexts/screener/server` — server-only.
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
  GoodsCategorySelection,
  EmailCapture,
} from './types'

export type {
  ScreenerSessionRecord,
  LeadRecord,
  ScreenerRepo,
  CreateSessionInput,
  CreateLeadInput,
} from './repo'

export { QUESTIONS, QUESTION_BY_ID } from './questions'
export { COUNTRIES, filterCountries } from './countries'
export type { Country } from './countries'
export { nextQuestion, isComplete } from './branching'
export { estimateRefund, ESTIMATOR_VERSION } from './estimator'
export { computeResult, RESULT_VERSION } from './qualification'
