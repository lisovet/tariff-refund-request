import type { ActorRef, StaffRole } from './case-machine'
import type { CaseRepo } from './repo'

/**
 * Case claim / release / reassign per PRD 04 §Ops console.
 *
 * Ownership is an optimistic-concurrency write on `cases.owner_staff_id`.
 * The repo's `casSetOwner` does the compare-and-swap; the service
 * wraps that with role gates + audit logging.
 *
 * Role gates:
 *   - claim   → any staff (coordinator / analyst / validator / admin)
 *   - release → owner-of-record OR admin
 *   - reassign → coordinator / admin only
 *
 * Every action writes an audit row (`case.claimed`, `case.released`,
 * `case.reassigned`) carrying the before/after owner ids.
 */

const STAFF_ROLES: ReadonlyArray<StaffRole> = [
  'coordinator',
  'analyst',
  'validator',
  'admin',
]

function isStaff(actor: ActorRef): boolean {
  return (STAFF_ROLES as readonly string[]).includes(actor.role)
}

export interface AssignmentDeps {
  readonly caseRepo: CaseRepo
  readonly clock: () => Date
}

export interface ClaimCaseInput {
  readonly caseId: string
  readonly actor: ActorRef
}

export type ClaimCaseResult =
  | {
      readonly ok: true
      readonly caseId: string
      readonly ownerStaffId: string
      readonly alreadyOwned: boolean
    }
  | { readonly ok: false; readonly reason: 'case_not_found' }
  | { readonly ok: false; readonly reason: 'not_staff' }
  | {
      readonly ok: false
      readonly reason: 'already_claimed'
      readonly currentOwnerStaffId: string
    }

export async function claimCase(
  input: ClaimCaseInput,
  deps: AssignmentDeps,
): Promise<ClaimCaseResult> {
  if (!isStaff(input.actor)) return { ok: false, reason: 'not_staff' }

  const existing = await deps.caseRepo.findCase(input.caseId)
  if (!existing) return { ok: false, reason: 'case_not_found' }

  // Idempotent self-claim — no write, no audit row.
  if (existing.ownerStaffId === input.actor.id) {
    return {
      ok: true,
      caseId: input.caseId,
      ownerStaffId: input.actor.id,
      alreadyOwned: true,
    }
  }

  // Held by someone else — reject up front. The CAS below handles
  // the race case where this check passes but another actor writes
  // between check and write.
  if (existing.ownerStaffId !== null) {
    return {
      ok: false,
      reason: 'already_claimed',
      currentOwnerStaffId: existing.ownerStaffId,
    }
  }

  const occurredAt = deps.clock()
  const updated = await deps.caseRepo.casSetOwner({
    caseId: input.caseId,
    expectedOwnerStaffId: null,
    nextOwnerStaffId: input.actor.id,
    occurredAt,
  })
  if (!updated) {
    // Race lost — re-read to surface who did win.
    const after = await deps.caseRepo.findCase(input.caseId)
    return {
      ok: false,
      reason: 'already_claimed',
      currentOwnerStaffId: after?.ownerStaffId ?? 'unknown',
    }
  }

  await deps.caseRepo.appendAuditEntry({
    caseId: input.caseId,
    actorId: input.actor.id,
    kind: 'case.claimed',
    payload: { fromOwnerStaffId: null, toOwnerStaffId: input.actor.id },
    occurredAt,
  })

  return {
    ok: true,
    caseId: input.caseId,
    ownerStaffId: input.actor.id,
    alreadyOwned: false,
  }
}

export interface ReleaseCaseInput {
  readonly caseId: string
  readonly actor: ActorRef
}

export type ReleaseCaseResult =
  | { readonly ok: true; readonly caseId: string }
  | { readonly ok: false; readonly reason: 'case_not_found' }
  | { readonly ok: false; readonly reason: 'not_staff' }
  | { readonly ok: false; readonly reason: 'not_claimed' }
  | { readonly ok: false; readonly reason: 'not_owner' }

export async function releaseCase(
  input: ReleaseCaseInput,
  deps: AssignmentDeps,
): Promise<ReleaseCaseResult> {
  if (!isStaff(input.actor)) return { ok: false, reason: 'not_staff' }

  const existing = await deps.caseRepo.findCase(input.caseId)
  if (!existing) return { ok: false, reason: 'case_not_found' }
  if (existing.ownerStaffId === null) {
    return { ok: false, reason: 'not_claimed' }
  }
  const isOwner = existing.ownerStaffId === input.actor.id
  const isAdmin = input.actor.role === 'admin'
  if (!isOwner && !isAdmin) return { ok: false, reason: 'not_owner' }

  const previousOwner = existing.ownerStaffId
  const occurredAt = deps.clock()
  const updated = await deps.caseRepo.casSetOwner({
    caseId: input.caseId,
    expectedOwnerStaffId: previousOwner,
    nextOwnerStaffId: null,
    occurredAt,
  })
  if (!updated) {
    // CAS miss — owner changed out from under us. Retry logic
    // lives with the caller; we surface as not_owner so the UI
    // can re-fetch.
    return { ok: false, reason: 'not_owner' }
  }

  await deps.caseRepo.appendAuditEntry({
    caseId: input.caseId,
    actorId: input.actor.id,
    kind: 'case.released',
    payload: { fromOwnerStaffId: previousOwner, toOwnerStaffId: null },
    occurredAt,
  })

  return { ok: true, caseId: input.caseId }
}

export interface ReassignCaseInput {
  readonly caseId: string
  readonly actor: ActorRef
  readonly toStaffId: string
}

export type ReassignCaseResult =
  | { readonly ok: true; readonly caseId: string; readonly ownerStaffId: string }
  | { readonly ok: false; readonly reason: 'case_not_found' }
  | { readonly ok: false; readonly reason: 'not_authorized' }

export async function reassignCase(
  input: ReassignCaseInput,
  deps: AssignmentDeps,
): Promise<ReassignCaseResult> {
  const role = input.actor.role
  if (role !== 'coordinator' && role !== 'admin') {
    return { ok: false, reason: 'not_authorized' }
  }

  const existing = await deps.caseRepo.findCase(input.caseId)
  if (!existing) return { ok: false, reason: 'case_not_found' }

  const previousOwner = existing.ownerStaffId
  const occurredAt = deps.clock()
  const updated = await deps.caseRepo.casSetOwner({
    caseId: input.caseId,
    expectedOwnerStaffId: previousOwner,
    nextOwnerStaffId: input.toStaffId,
    occurredAt,
  })
  if (!updated) {
    // CAS miss on reassign is rare (coordinator/admin vs another
    // coordinator/admin). Surface as case_not_found so the UI
    // re-fetches.
    return { ok: false, reason: 'case_not_found' }
  }

  await deps.caseRepo.appendAuditEntry({
    caseId: input.caseId,
    actorId: input.actor.id,
    kind: 'case.reassigned',
    payload: {
      fromOwnerStaffId: previousOwner,
      toOwnerStaffId: input.toStaffId,
    },
    occurredAt,
  })

  return { ok: true, caseId: input.caseId, ownerStaffId: input.toStaffId }
}
