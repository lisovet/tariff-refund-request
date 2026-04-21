import { describe, expect, it } from 'vitest'
import { AnonymousActor, type Actor } from '../actor'
import { can } from '../can'

/**
 * Permission helper. Per ADR 001 + PRD 04: authorization is enforced
 * inside the contexts, not only the middleware. `can(actor, action)`
 * is the single chokepoint contexts use to decide.
 *
 * Actions are typed and grouped per-context so adding a new action is
 * a one-line addition that the type system fans out into can().
 */

const customer: Actor = {
  kind: 'customer',
  id: 'cus_x',
  clerkUserId: 'user_x',
  email: 'a@b.co',
}

const analyst: Actor = {
  kind: 'staff',
  id: 'stf_a',
  clerkUserId: 'user_a',
  role: 'analyst',
  name: 'A. Analyst',
}
const validator: Actor = { ...analyst, id: 'stf_v', role: 'validator' }
const coordinator: Actor = { ...analyst, id: 'stf_c', role: 'coordinator' }
const admin: Actor = { ...analyst, id: 'stf_ad', role: 'admin' }

describe('can — anonymous', () => {
  it('refuses every protected action', () => {
    expect(can(AnonymousActor, 'screener.complete')).toBe(true)
    expect(can(AnonymousActor, 'case.read')).toBe(false)
    expect(can(AnonymousActor, 'ops.queue.view')).toBe(false)
  })
})

describe('can — customer', () => {
  it('can access screener + own case + own uploads', () => {
    expect(can(customer, 'screener.complete')).toBe(true)
    expect(can(customer, 'case.read')).toBe(true)
    expect(can(customer, 'document.upload')).toBe(true)
  })

  it('cannot reach ops surfaces', () => {
    expect(can(customer, 'ops.queue.view')).toBe(false)
    expect(can(customer, 'qa.signoff')).toBe(false)
    expect(can(customer, 'admin.refund.issue')).toBe(false)
  })
})

describe('can — staff', () => {
  it('coordinator can triage queues and assign cases', () => {
    expect(can(coordinator, 'ops.queue.view')).toBe(true)
    expect(can(coordinator, 'ops.case.assign')).toBe(true)
    expect(can(coordinator, 'qa.signoff')).toBe(false)
    expect(can(coordinator, 'admin.refund.issue')).toBe(false)
  })

  it('analyst can extract entries but not sign off QA', () => {
    expect(can(analyst, 'ops.queue.view')).toBe(true)
    expect(can(analyst, 'entry.extract')).toBe(true)
    expect(can(analyst, 'qa.signoff')).toBe(false)
    expect(can(analyst, 'admin.refund.issue')).toBe(false)
  })

  it('validator owns QA sign-off (per PRD 04 human-QA gate)', () => {
    expect(can(validator, 'qa.signoff')).toBe(true)
  })

  it('admin can do everything coordinator+analyst+validator can, plus admin actions', () => {
    expect(can(admin, 'ops.queue.view')).toBe(true)
    expect(can(admin, 'entry.extract')).toBe(true)
    expect(can(admin, 'qa.signoff')).toBe(true)
    expect(can(admin, 'admin.refund.issue')).toBe(true)
    expect(can(admin, 'admin.role.manage')).toBe(true)
  })

  it('only admin manages roles', () => {
    expect(can(coordinator, 'admin.role.manage')).toBe(false)
    expect(can(analyst, 'admin.role.manage')).toBe(false)
    expect(can(validator, 'admin.role.manage')).toBe(false)
  })
})
