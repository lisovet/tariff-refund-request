'use client'

import { useEffect } from 'react'
import { useClerk, useOrganization, useOrganizationList } from '@clerk/nextjs'

/**
 * Activates the user's first organization membership on a session that
 * has none. Without this, Clerk issues a JWT with no `org_role`, the
 * middleware can't see a staff role on /ops, and the user gets bounced
 * back to /app indefinitely.
 *
 * The component renders nothing — pure side effect. Pass `redirectTo`
 * to send the user onward once the org is active (e.g. /ops when this
 * is mounted on /app as part of the bounce recovery).
 */
export function EnsureActiveOrg({ redirectTo }: { readonly redirectTo?: string }) {
  const clerk = useClerk()
  const { organization, isLoaded: activeLoaded } = useOrganization()
  const { isLoaded: listLoaded, userMemberships } = useOrganizationList({
    userMemberships: { infinite: false },
  })

  useEffect(() => {
    if (!activeLoaded || !listLoaded) return
    if (organization) return
    const first = userMemberships.data?.[0]
    if (!first) return
    void clerk.setActive({ organization: first.organization.id }).then(() => {
      if (redirectTo) {
        window.location.href = redirectTo
      } else {
        window.location.reload()
      }
    })
  }, [
    activeLoaded,
    listLoaded,
    organization,
    userMemberships.data,
    clerk,
    redirectTo,
  ])

  return null
}
