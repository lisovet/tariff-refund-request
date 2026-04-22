'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/app/_components/ui'
import { clearScreenerSessionAndResult } from './session'

/**
 * Start-over affordance on the disqualified dossier.
 * Clears both answers-in-progress + cached result, then navigates
 * back to /screener so the user lands on q1 with fresh state.
 */
export function StartOverButton() {
  const router = useRouter()
  return (
    <Button
      type="button"
      variant="underline"
      size="lg"
      onClick={() => {
        clearScreenerSessionAndResult()
        router.push('/screener')
        // Hard refresh in case the page is already mounted with the
        // cached result still in React state.
        router.refresh()
      }}
    >
      Start over
    </Button>
  )
}
