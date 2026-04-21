import { describe, expect, it } from 'vitest'
import {
  SAVED_VIEWS,
  SLA_TARGETS_BY_STATE,
  computeQueueRow,
  filterQueue,
  resolveSavedView,
  type QueueFilter,
} from '../queue'
import type { CaseRecord } from '../repo'

/**
 * Queue helpers — pure. Given a CaseRecord + now, computes the
 * row data the ops queue page renders. No repo access here.
 */

const NOW = new Date('2026-04-21T14:00:00.000Z')

function mkCase(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    id: 'cas_1',
    state: 'batch_qa',
    tier: 'smb',
    customerId: 'cus_1',
    screenerSessionId: null,
    ownerStaffId: 'stf_mina',
    createdAt: new Date('2026-04-20T14:00:00.000Z'),
    updatedAt: new Date('2026-04-21T10:00:00.000Z'),
    ...overrides,
  }
}

describe('SLA_TARGETS_BY_STATE', () => {
  it('carries a target for the main queue-critical states', () => {
    expect(SLA_TARGETS_BY_STATE.batch_qa).toBeGreaterThan(0)
    expect(SLA_TARGETS_BY_STATE.new_lead).toBeGreaterThan(0)
    expect(SLA_TARGETS_BY_STATE.entry_recovery_in_progress).toBeGreaterThan(0)
  })

  it('terminal states have no SLA (undefined)', () => {
    expect(SLA_TARGETS_BY_STATE.closed).toBeUndefined()
    expect(SLA_TARGETS_BY_STATE.paid).toBeUndefined()
  })
})

describe('computeQueueRow', () => {
  it('derives age since updatedAt', () => {
    const row = computeQueueRow(
      mkCase({ updatedAt: new Date('2026-04-21T13:00:00.000Z') }),
      NOW,
    )
    expect(row.ageMs).toBe(60 * 60 * 1000)
    expect(row.ageHumanized).toBe('1h')
  })

  it('humanizes age in d / h / m buckets', () => {
    const c15m = computeQueueRow(
      mkCase({ updatedAt: new Date('2026-04-21T13:45:00.000Z') }),
      NOW,
    )
    expect(c15m.ageHumanized).toBe('15m')
    const c3d = computeQueueRow(
      mkCase({ updatedAt: new Date('2026-04-18T14:00:00.000Z') }),
      NOW,
    )
    expect(c3d.ageHumanized).toBe('3d')
  })

  it('flags SLA breach when age > target for the current state', () => {
    // new_lead SLA is 24h — 30h old is a breach.
    const row = computeQueueRow(
      mkCase({
        state: 'new_lead',
        updatedAt: new Date(NOW.getTime() - 30 * 60 * 60 * 1000),
      }),
      NOW,
    )
    expect(row.isSlaBreach).toBe(true)
  })

  it('does NOT flag SLA breach when state has no target (terminal)', () => {
    const row = computeQueueRow(
      mkCase({
        state: 'closed',
        updatedAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
      NOW,
    )
    expect(row.isSlaBreach).toBe(false)
  })

  it('preserves id / state / tier / owner on the row', () => {
    const row = computeQueueRow(
      mkCase({ id: 'cas_X', tier: 'mid_market', ownerStaffId: 'stf_owner' }),
      NOW,
    )
    expect(row.id).toBe('cas_X')
    expect(row.tier).toBe('mid_market')
    expect(row.ownerStaffId).toBe('stf_owner')
  })
})

describe('filterQueue', () => {
  const c1 = mkCase({ id: 'c1', state: 'batch_qa', ownerStaffId: 'stf_a' })
  const c2 = mkCase({ id: 'c2', state: 'batch_qa', ownerStaffId: null })
  const c3 = mkCase({ id: 'c3', state: 'awaiting_docs', ownerStaffId: 'stf_a' })
  const c4 = mkCase({ id: 'c4', state: 'stalled', ownerStaffId: 'stf_b', tier: 'mid_market' })

  const cases = [c1, c2, c3, c4]

  it('returns every case when filter is empty', () => {
    expect(filterQueue(cases, {})).toHaveLength(4)
  })

  it('filters by a single state', () => {
    expect(filterQueue(cases, { states: ['batch_qa'] }).map((c) => c.id)).toEqual(['c1', 'c2'])
  })

  it('filters by multiple states (union)', () => {
    expect(filterQueue(cases, { states: ['batch_qa', 'stalled'] }).map((c) => c.id)).toEqual([
      'c1',
      'c2',
      'c4',
    ])
  })

  it('filters by ownerStaffId', () => {
    expect(filterQueue(cases, { ownerStaffId: 'stf_a' }).map((c) => c.id)).toEqual(['c1', 'c3'])
  })

  it('filters unassigned via ownerStaffId: null', () => {
    expect(filterQueue(cases, { ownerStaffId: null }).map((c) => c.id)).toEqual(['c2'])
  })

  it('filters by tier', () => {
    expect(filterQueue(cases, { tier: 'mid_market' }).map((c) => c.id)).toEqual(['c4'])
  })

  it('composes multiple filters (AND)', () => {
    const filter: QueueFilter = { states: ['batch_qa'], ownerStaffId: 'stf_a' }
    expect(filterQueue(cases, filter).map((c) => c.id)).toEqual(['c1'])
  })
})

describe('SAVED_VIEWS + resolveSavedView', () => {
  it('exposes the v1 canonical views', () => {
    const ids = SAVED_VIEWS.map((v) => v.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'unassigned',
        'my_batch_qa',
        'stalled',
        'all_active',
      ]),
    )
  })

  it('each view has a human label + a describing filter (object or viewer→filter fn)', () => {
    for (const v of SAVED_VIEWS) {
      expect(v.label.length).toBeGreaterThan(0)
      expect(['object', 'function']).toContain(typeof v.filter)
    }
  })

  it('resolveSavedView(id, viewer) returns the right filter — my_batch_qa binds to the viewer', () => {
    const resolved = resolveSavedView('my_batch_qa', { staffId: 'stf_me' })
    expect(resolved?.states).toEqual(['batch_qa'])
    expect(resolved?.ownerStaffId).toBe('stf_me')
  })

  it('resolveSavedView("unassigned") returns ownerStaffId: null', () => {
    const resolved = resolveSavedView('unassigned', { staffId: 'stf_anyone' })
    expect(resolved?.ownerStaffId).toBeNull()
  })

  it('resolveSavedView(unknown) returns undefined', () => {
    expect(resolveSavedView('what', { staffId: 'stf_me' })).toBeUndefined()
  })
})
