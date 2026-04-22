/**
 * Screener client-side session helpers.
 *
 * The screener persists two separate sessionStorage keys:
 *   - answers-in-progress (owned by ScreenerFlow)
 *   - completed ScreenerResult (owned by /screener/page.tsx)
 *
 * `clearScreenerSession()` wipes both so a returning user starts
 * from q1 with no cached verdict. Safe to call from server code —
 * it no-ops when `window` is undefined.
 */

import { clearScreenerSession as clearFlowAnswers } from './ScreenerFlow'

export const SCREENER_RESULT_STORAGE_KEY = 'tariff-refund:screener-result:v1'

export function clearScreenerResult(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SCREENER_RESULT_STORAGE_KEY)
  } catch {
    // Ignored — private-mode storage can throw.
  }
}

export function clearScreenerSessionAndResult(): void {
  clearFlowAnswers()
  clearScreenerResult()
}
