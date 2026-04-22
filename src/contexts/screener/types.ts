/**
 * Screener domain types per PRD 01.
 *
 * `ScreenerAnswers` is partial mid-flow; complete only when isComplete()
 * is true (terminal-DQ on q1=no / q3=no, or all 10 captured).
 */

export type YesNo = 'yes' | 'no'
export type YesNoUnknown = 'yes' | 'no' | 'dont_know'

export type ClearancePath =
  | 'broker'
  | 'carrier'
  | 'ace_self_filed'
  | 'mixed'

export type ShipmentBand = 'under_5' | '5_50' | '50_500' | '500_plus'

export type DutyBand =
  | 'band_under_5k'
  | 'band_5k_50k'
  | 'band_50k_500k'
  | 'band_500k_5m'
  | 'band_over_5m'

export type GoodsCategory =
  | 'apparel_fashion'
  | 'jewelry_watches'
  | 'consumer_electronics'
  | 'furniture_home'
  | 'footwear'
  | 'toys_games'
  | 'machinery_parts'
  | 'steel_metals'
  | 'other'

export interface GoodsCategorySelection {
  readonly categories: readonly GoodsCategory[]
  readonly otherText?: string
}

export interface EmailCapture {
  readonly company: string
  readonly email: string
}

export interface ScreenerAnswers {
  q1?: YesNo // imported in window
  q2?: string // country of manufacture (ISO-2 or 'unknown')
  q3?: YesNo // is IOR
  q4?: ClearancePath
  q5?: ShipmentBand
  q6?: DutyBand
  q7?: GoodsCategorySelection
  q8?: YesNoUnknown // entries liquidated
  q9?: YesNoUnknown // ACE account
  q10?: EmailCapture
}

export type RecoveryPath =
  | 'broker'
  | 'carrier'
  | 'ace-self-export'
  | 'mixed'

export type Qualification = 'qualified' | 'likely_qualified' | 'disqualified'

export type DisqualificationReason =
  | 'no_imports_in_window'
  | 'not_ior'
  | 'unknown'

export type Confidence = 'high' | 'moderate' | 'low'

export type RecommendedNextStep =
  | 'recovery_kit'
  | 'recovery_service'
  | 'cape_prep'
  | 'concierge'
  | 'none'

export interface RefundEstimate {
  readonly low: number
  readonly high: number
  readonly confidence: Confidence
  readonly version: string
}

export interface Prerequisites {
  readonly ace: boolean
  readonly ach: boolean
  readonly ior: boolean
  readonly liquidationKnown: boolean
}

export interface ScreenerResult {
  readonly qualification: Qualification
  readonly refundEstimate: RefundEstimate | null
  readonly confidence: Confidence
  readonly recoveryPath: RecoveryPath | null
  readonly prerequisites: Prerequisites
  readonly recommendedNextStep: RecommendedNextStep
  readonly disqualificationReason?: DisqualificationReason
  readonly version: string
}

/** Question metadata used by the UI but not by the branching logic. */
export interface Question {
  readonly id:
    | 'q1'
    | 'q2'
    | 'q3'
    | 'q4'
    | 'q5'
    | 'q6'
    | 'q7'
    | 'q8'
    | 'q9'
    | 'q10'
  readonly prompt: string
  /** Optional editorial subtitle rendered under the headline. */
  readonly subtitle?: string
  readonly kind:
    | 'yes_no'
    | 'yes_no_unknown'
    | 'country'
    | 'clearance_path'
    | 'shipment_band'
    | 'duty_band'
    | 'multi_category'
    | 'email_capture'
}
