import { determineRecoveryPath } from '@contexts/recovery'
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
 * recovery-path determination (delegated to @contexts/recovery per
 * ADR 015), prerequisite signals, and the recommended next paid step.
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
  const recoveryPath = determineRecoveryPath(answers) as RecoveryPath | null
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
  _clearancePath: ClearancePath | undefined,
  dutyBand: DutyBand | undefined,
  recoveryPath: RecoveryPath | null,
): RecommendedNextStep {
  if (qualification === 'disqualified') return 'none'

  // Full Prep is the right fit whenever the paperwork burden is
  // large enough that a self-serve checklist starts to feel
  // unreasonable: mid-to-large duty bands, OR a mixed clearance
  // path (documents scattered across multiple sources). Everyone
  // else gets the self-serve Audit tier; they can upgrade to Full
  // Prep later with the $99 credit.
  const largeDuty =
    dutyBand === 'band_50k_500k' ||
    dutyBand === 'band_500k_5m' ||
    dutyBand === 'band_over_5m'
  if (largeDuty) return 'full_prep'
  if (recoveryPath === 'mixed') return 'full_prep'

  return 'audit'
}
