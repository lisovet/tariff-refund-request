import { ESTIMATOR_VERSION, estimateRefund } from './estimator'
import type {
  ClearancePath,
  DutyBand,
  Prerequisites,
  Qualification,
  RecommendedNextStep,
  RecoveryPath,
  ScreenerAnswers,
  ScreenerResult,
} from './types'

/**
 * computeResult — pure function from ScreenerAnswers to the typed
 * ScreenerResult per PRD 01. Combines qualification, refund estimate,
 * recovery-path determination, prerequisite signals, and the
 * recommended next paid step.
 *
 * TODO(task-49): the recovery-path mapping currently lives inline; task
 * #49 will extract `determineRecoveryPath` into
 * src/contexts/recovery/routing.ts per ADR 015 and the screener will
 * call it instead of re-implementing.
 */

export const RESULT_VERSION = `screener-v1+estimator-${ESTIMATOR_VERSION}`

export function computeResult(answers: ScreenerAnswers): ScreenerResult {
  // Disqualification shortcuts.
  if (answers.q1 === 'no') {
    return baseDqResult(answers, 'no_imports_in_window')
  }
  if (answers.q3 === 'no') {
    return baseDqResult(answers, 'not_ior')
  }

  const refundEstimate = estimateRefund(answers)
  const recoveryPath = mapRecoveryPath(answers.q4)
  const prerequisites = computePrerequisites(answers)
  const qualification = computeQualification(answers, prerequisites)
  const confidence = refundEstimate?.confidence ?? 'low'
  const recommendedNextStep = recommendNextStep(
    qualification,
    answers.q4,
    answers.q6,
    recoveryPath,
  )

  return {
    qualification,
    refundEstimate,
    confidence,
    recoveryPath,
    prerequisites,
    recommendedNextStep,
    version: RESULT_VERSION,
  }
}

function baseDqResult(
  _answers: ScreenerAnswers,
  reason: 'no_imports_in_window' | 'not_ior',
): ScreenerResult {
  return {
    qualification: 'disqualified',
    refundEstimate: null,
    confidence: 'low',
    recoveryPath: null,
    prerequisites: { ace: false, ach: false, ior: false, liquidationKnown: false },
    recommendedNextStep: 'none',
    disqualificationReason: reason,
    version: RESULT_VERSION,
  }
}

function mapRecoveryPath(q4: ClearancePath | undefined): RecoveryPath | null {
  switch (q4) {
    case 'broker':
      return 'broker'
    case 'carrier':
      return 'carrier'
    case 'ace_self_filed':
      return 'ace-self-export'
    case 'mixed':
      return 'mixed'
    default:
      return null
  }
}

function computePrerequisites(answers: ScreenerAnswers): Prerequisites {
  return {
    ace: answers.q9 === 'yes',
    // ACH on file is not a screener question in v1; default false until
    // recovery-onboarding gathers it (lands in the recovery workspace).
    ach: false,
    ior: answers.q3 === 'yes',
    liquidationKnown: answers.q8 === 'yes' || answers.q8 === 'no',
  }
}

function computeQualification(
  answers: ScreenerAnswers,
  prerequisites: Prerequisites,
): Qualification {
  // Strongly qualified if we have IOR + duty band + clearance path + all
  // prerequisite signals known.
  if (
    prerequisites.ior &&
    answers.q6 !== undefined &&
    answers.q4 !== undefined &&
    prerequisites.liquidationKnown
  ) {
    return 'qualified'
  }
  return 'likely_qualified'
}

function recommendNextStep(
  qualification: Qualification,
  clearancePath: ClearancePath | undefined,
  dutyBand: DutyBand | undefined,
  recoveryPath: RecoveryPath | null,
): RecommendedNextStep {
  if (qualification === 'disqualified') return 'none'

  // Big duty + complex (mixed) recovery path → concierge.
  if (
    (dutyBand === 'band_over_5m' || dutyBand === 'band_500k_5m') &&
    recoveryPath === 'mixed'
  ) {
    return 'concierge'
  }

  // Mid-band + recoverable path → recovery_service (analyst-assisted).
  if (
    dutyBand === 'band_50k_500k' &&
    (clearancePath === 'broker' ||
      clearancePath === 'carrier' ||
      clearancePath === 'ace_self_filed')
  ) {
    return 'recovery_service'
  }

  // Small duty → recovery_kit (self-serve).
  if (dutyBand === 'band_under_5k' || dutyBand === 'band_5k_50k') {
    return 'recovery_kit'
  }

  // Larger duties default to service unless concierge fired above.
  if (dutyBand === 'band_500k_5m' || dutyBand === 'band_over_5m') {
    return 'recovery_service'
  }

  return 'recovery_kit'
}
