/**
 * Actor — the resolved identity of whoever's making a request. Every
 * context method accepts an `Actor` and decides what they may do via
 * the `can()` helper landing in task #10.
 *
 * Per ADR 004: the platform never imports Clerk types directly. Only
 * the resolver (also in task #10) translates Clerk's user → Actor.
 */

export type StaffRole = 'coordinator' | 'analyst' | 'validator' | 'admin'

export interface CustomerActor {
  readonly kind: 'customer'
  readonly id: string
  readonly clerkUserId: string
  readonly email: string
  readonly orgId?: string // partner attribution lands in PRD 09 (Phase 3)
}

export interface StaffActor {
  readonly kind: 'staff'
  readonly id: string
  readonly clerkUserId: string
  readonly role: StaffRole
  readonly name: string
}

export interface AnonymousActorType {
  readonly kind: 'anonymous'
}

export const AnonymousActor: AnonymousActorType = { kind: 'anonymous' } as const

export type Actor = CustomerActor | StaffActor | AnonymousActorType

export const isAnonymous = (a: Actor): a is AnonymousActorType =>
  a.kind === 'anonymous'

export const isCustomer = (a: Actor): a is CustomerActor =>
  a.kind === 'customer'

export const isStaff = (a: Actor): a is StaffActor => a.kind === 'staff'
