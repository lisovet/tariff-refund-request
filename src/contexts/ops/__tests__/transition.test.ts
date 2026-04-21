import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInMemoryCaseRepo } from '../in-memory-repo'
import { transition, type TransitionDeps } from '../transition'
import type { CaseRepo } from '../repo'

/**
 * Integration-style tests for the case service. Uses the in-memory
 * repo so we exercise the same contract the Drizzle repo will need
 * to satisfy (single-transaction case+audit write).
 */

function makeDeps(): {
  deps: TransitionDeps
  repo: CaseRepo
  publishCalls: Array<{ caseId: string; from: string; to: string; actorId: string }>
} {
  const repo = createInMemoryCaseRepo()
  const publishCalls: Array<{
    caseId: string
    from: string
    to: string
    actorId: string
  }> = []
  return {
    repo,
    publishCalls,
    deps: {
      repo,
      publishCaseTransitioned: vi.fn(async (payload) => {
        publishCalls.push({
          caseId: payload.caseId,
          from: payload.from,
          to: payload.to,
          actorId: payload.actorId,
        })
      }),
      clock: () => new Date('2026-04-21T10:00:00Z'),
    },
  }
}

describe('transition() — happy path', () => {
  it('advances the case, writes an audit row, and publishes the event', async () => {
    const { deps, repo, publishCalls } = makeDeps()
    const c = await repo.createCase({ tier: 'smb' })

    const result = await transition(
      {
        caseId: c.id,
        event: { type: 'SCREENER_RESULT_QUALIFIED' },
      },
      deps,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.from).toBe('new_lead')
    expect(result.to).toBe('qualified')

    // case.state advanced
    const after = await repo.findCase(c.id)
    expect(after?.state).toBe('qualified')

    // audit row exists
    const audit = await repo.listAudit(c.id)
    expect(audit).toHaveLength(1)
    expect(audit[0]?.fromState).toBe('new_lead')
    expect(audit[0]?.toState).toBe('qualified')
    expect(audit[0]?.kind).toBe('SCREENER_RESULT_QUALIFIED')

    // publish fired
    expect(publishCalls).toHaveLength(1)
    expect(publishCalls[0]).toEqual({
      caseId: c.id,
      from: 'new_lead',
      to: 'qualified',
      actorId: 'system',
    })
  })

  it('records the actor id on the audit row when supplied', async () => {
    const { deps, repo } = makeDeps()
    const c = await repo.createCase({ tier: 'smb' })
    await transition(
      {
        caseId: c.id,
        event: { type: 'SCREENER_RESULT_QUALIFIED' },
        actor: { id: 'stf_42', role: 'coordinator' },
      },
      deps,
    )
    const audit = await repo.listAudit(c.id)
    expect(audit[0]?.actorId).toBe('stf_42')
  })
})

describe('transition() — failure modes', () => {
  it('returns case_not_found when caseId is unknown', async () => {
    const { deps } = makeDeps()
    const result = await transition(
      { caseId: 'cas_missing', event: { type: 'SCREENER_RESULT_QUALIFIED' } },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('case_not_found')
  })

  it('returns invalid_transition when the event is not legal from current state', async () => {
    const { deps, repo, publishCalls } = makeDeps()
    const c = await repo.createCase({ tier: 'smb' })
    // new_lead does not accept CBP_PAID
    const result = await transition(
      { caseId: c.id, event: { type: 'CBP_PAID' } },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('invalid_transition')
    expect(result.from).toBe('new_lead')

    // No audit row, no publish.
    expect(await repo.listAudit(c.id)).toHaveLength(0)
    expect(publishCalls).toHaveLength(0)
  })

  it('returns guard_rejected when VALIDATOR_SIGNED_OFF lacks the validator role', async () => {
    const { deps, repo, publishCalls } = makeDeps()
    const c = await repo.createCase({ tier: 'smb' })

    // Walk the case to batch_qa via direct repo writes (avoid 8-step setup).
    await deps.repo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'batch_qa',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date('2026-04-21T09:00:00Z'),
    })
    publishCalls.length = 0

    const result = await transition(
      {
        caseId: c.id,
        event: {
          type: 'VALIDATOR_SIGNED_OFF',
          actor: { id: 'stf_a', role: 'analyst' },
        },
        actor: { id: 'stf_a', role: 'analyst' },
      },
      deps,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('guard_rejected')

    // Still in batch_qa.
    expect((await repo.findCase(c.id))?.state).toBe('batch_qa')
    expect(publishCalls).toHaveLength(0)
  })

  it('does NOT roll back the DB write when the publish callback throws', async () => {
    const repo = createInMemoryCaseRepo()
    const publishCaseTransitioned = vi.fn(async () => {
      throw new Error('inngest unavailable')
    })
    const c = await repo.createCase({ tier: 'smb' })

    await expect(
      transition(
        { caseId: c.id, event: { type: 'SCREENER_RESULT_QUALIFIED' } },
        { repo, publishCaseTransitioned, clock: () => new Date() },
      ),
    ).rejects.toThrow(/inngest unavailable/)

    // The DB write happened before the publish — the case advanced.
    expect((await repo.findCase(c.id))?.state).toBe('qualified')
    expect(await repo.listAudit(c.id)).toHaveLength(1)
  })
})

describe('transition() — VALIDATOR_SIGNED_OFF allows actor enrichment from the actor argument', () => {
  it('lets the caller pass actor on the input rather than embedding it on the event', async () => {
    const { deps, repo } = makeDeps()
    const c = await repo.createCase({ tier: 'smb' })
    await deps.repo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'batch_qa',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date('2026-04-21T09:00:00Z'),
    })

    const result = await transition(
      {
        caseId: c.id,
        // Bare event — actor lifted from the actor field.
        event: { type: 'VALIDATOR_SIGNED_OFF' } as never,
        actor: { id: 'stf_v', role: 'validator' },
      },
      deps,
    )
    expect(result.ok).toBe(true)
    expect((await repo.findCase(c.id))?.state).toBe('submission_ready')
  })
})

describe('createInMemoryCaseRepo — invariants', () => {
  let repo: CaseRepo

  beforeEach(() => {
    repo = createInMemoryCaseRepo()
  })

  it('starts every case in new_lead', async () => {
    const c = await repo.createCase({ tier: 'mid_market' })
    expect(c.state).toBe('new_lead')
    expect(c.tier).toBe('mid_market')
  })

  it('rejects recordTransition with a stale `from`', async () => {
    const c = await repo.createCase({ tier: 'smb' })
    await repo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'qualified',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: new Date(),
    })
    await expect(
      repo.recordTransition({
        caseId: c.id,
        from: 'new_lead', // stale!
        to: 'awaiting_purchase',
        event: { type: 'LIFECYCLE_DELIVERED' },
        actorId: null,
        occurredAt: new Date(),
      }),
    ).rejects.toThrow(/drifted/i)
  })

  it('listAudit returns rows in occurredAt order', async () => {
    const c = await repo.createCase({ tier: 'smb' })
    const t1 = new Date('2026-04-21T08:00:00Z')
    const t2 = new Date('2026-04-21T09:00:00Z')
    await repo.recordTransition({
      caseId: c.id,
      from: 'new_lead',
      to: 'qualified',
      event: { type: 'SCREENER_RESULT_QUALIFIED' },
      actorId: null,
      occurredAt: t2, // inserted in the wrong order
    })
    await repo.recordTransition({
      caseId: c.id,
      from: 'qualified',
      to: 'awaiting_purchase',
      event: { type: 'LIFECYCLE_DELIVERED' },
      actorId: null,
      occurredAt: t1, // earlier timestamp inserted second
    })
    const audit = await repo.listAudit(c.id)
    expect(audit.map((r) => r.occurredAt)).toEqual([t1, t2])
  })
})
