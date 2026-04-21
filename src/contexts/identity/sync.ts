import { isStaffRole } from '@shared/infra/auth/roles'
import type { IdentityRepo } from './repo'

/**
 * Clerk webhook event dispatcher. Pure: takes the Clerk event payload
 * and an IdentityRepo, mutates state accordingly.
 *
 * Per ADR 004, we model exactly the events v1 cares about:
 *   - user.created                     → upsert customer
 *   - user.updated                     → re-upsert customer (idempotent)
 *   - organizationMembership.created   → upsert staff_user with role
 *   - organizationMembership.updated   → re-upsert (role may have changed)
 *   - organizationMembership.deleted   → deactivate staff_user (audit trail)
 *
 * Other event types are silent no-ops so Clerk webhooks we have not
 * modeled don't 500. Idempotency: every handler upserts (key:
 * clerkUserId UNIQUE), so retries are safe.
 */

interface SyncDeps {
  readonly repo: IdentityRepo
}

export interface ClerkWebhookEvent {
  readonly type: string
  readonly data: Record<string, unknown>
}

export async function handleClerkEvent(
  event: ClerkWebhookEvent,
  deps: SyncDeps,
): Promise<void> {
  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      await handleUserUpserted(event.data, deps)
      return
    case 'organizationMembership.created':
    case 'organizationMembership.updated':
      await handleMembershipUpserted(event.data, deps)
      return
    case 'organizationMembership.deleted':
      await handleMembershipDeleted(event.data, deps)
      return
    default:
      // Unmodeled event — log later (task #42 wires Axiom mirror), no-op.
      return
  }
}

async function handleUserUpserted(
  data: Record<string, unknown>,
  { repo }: SyncDeps,
): Promise<void> {
  const clerkUserId = stringField(data, 'id')
  const email = primaryEmail(data)
  if (!email) {
    throw new Error(
      `cannot upsert customer ${clerkUserId}: no primary email address on event`,
    )
  }
  await repo.upsertCustomer({
    clerkUserId,
    email,
    fullName: composeFullName(data),
  })
}

async function handleMembershipUpserted(
  data: Record<string, unknown>,
  { repo }: SyncDeps,
): Promise<void> {
  const role = stringField(data, 'role')
  if (!isStaffRole(role)) {
    throw new Error(`unrecognized staff role on membership event: ${role}`)
  }
  const userData = nested(data, 'public_user_data')
  const clerkUserId = stringField(userData, 'user_id')
  await repo.upsertStaffUser({
    clerkUserId,
    role,
    name: composeFullName(userData),
  })
}

async function handleMembershipDeleted(
  data: Record<string, unknown>,
  { repo }: SyncDeps,
): Promise<void> {
  const userData = nested(data, 'public_user_data')
  const clerkUserId = stringField(userData, 'user_id')
  await repo.deactivateStaffUser(clerkUserId)
}

// --- payload helpers -------------------------------------------------------

function stringField(obj: Record<string, unknown>, key: string): string {
  const value = obj[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`expected string field "${key}" on Clerk webhook payload`)
  }
  return value
}

function nested(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = obj[key]
  if (value === null || typeof value !== 'object') {
    throw new Error(`expected nested object "${key}" on Clerk webhook payload`)
  }
  return value as Record<string, unknown>
}

function primaryEmail(data: Record<string, unknown>): string | null {
  const primaryId = data.primary_email_address_id
  const list = data.email_addresses
  if (!Array.isArray(list)) return null
  const primary =
    typeof primaryId === 'string'
      ? list.find((e) => isEmailRecord(e) && e.id === primaryId)
      : list[0]
  if (!isEmailRecord(primary)) return null
  return primary.email_address
}

function isEmailRecord(
  value: unknown,
): value is { id: string; email_address: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email_address' in value &&
    typeof (value as { email_address: unknown }).email_address === 'string'
  )
}

function composeFullName(data: Record<string, unknown>): string {
  const first = typeof data.first_name === 'string' ? data.first_name : ''
  const last = typeof data.last_name === 'string' ? data.last_name : ''
  const composed = [first, last].filter((s) => s.length > 0).join(' ')
  return composed.length > 0 ? composed : 'Unknown'
}
