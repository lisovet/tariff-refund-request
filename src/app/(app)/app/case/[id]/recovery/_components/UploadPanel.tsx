'use client'

import { type ReactElement } from 'react'
import { UploadZone } from '@/app/_components/upload/UploadZone'

/**
 * Right pane: secure upload zone. Wraps UploadZone with the case-id
 * binding + the hairline-bordered shell the workspace expects.
 */

export interface UploadPanelProps {
  readonly caseId: string
}

export function UploadPanel({ caseId }: UploadPanelProps): ReactElement {
  return (
    <section
      aria-label="Upload documents"
      className="p-6 sm:p-8"
    >
      <UploadZone caseId={caseId} />
      <p className="mt-6 max-w-prose text-sm text-ink/65">
        Each upload becomes a recovery source linked to your case. A
        validator reviews it before the entries appear in your list.
      </p>
    </section>
  )
}
