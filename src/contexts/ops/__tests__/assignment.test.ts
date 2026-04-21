import { describe, expect, it } from 'vitest'
import {
  claimCase,
  reassignCase,
  releaseCase,
  type AssignmentDeps,
} from '../assignment'
import { createInMemoryCaseRepo } from '../in-memory-repo'
import type { ActorRef } from '../case-machine'

const NOW = new Date('2026-04-21T15:00:00.000Z')
const ANALYST: ActorRef = { id: 'stf_a1', role: 'analyst' }
const OTHER: ActorRef = { id: 'stf_a2', role: 'analyst' }
const COORD: ActorRef = { id: 'stf_c1', role: 'coordinator' }
const VALIDATOR: ActorRef = { id: 'stf_v1', role: 'validator' }

async function setup(): Promise<{
  caseId: string
  deps: AssignmentDeps
  repo: ReturnType<typeof createInMemoryCaseRepo>
}> {
  const repo = createInMemoryCaseRepo()
  const c = await repo.createCase({ tier: 'smb' })
  return {
    caseId: c.id,
    repo,
    deps: { caseRepo: repo, clock: () => NOW },
  }
}

describe('claimCase', () => {
  it('claims an unowned case for the actor + writes an audit row', async () => {
    const { caseId, deps, repo } = await setup()
    const result = await claimCase({ caseId, actor: ANALYST }, deps)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.ownerStaffId).toBe('stf_a1')
    const c = await repo.findCase(caseId)
    expect(c?.ownerStaffId).toBe('stf_a1')
    const audit = await repo.listAudit(caseId)
    expect(audit.some((a) => a.kind === 'case.claimed' && a.actorId === 'stf_a1')).toBe(
      true,
    )
  })

  it('refuses when the case is already claimed by someone else', async () => {
    const { caseId, deps } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const result = await claimCase({ caseId, actor: OTHER }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('already_claimed')
    if (result.reason !== 'already_claimed') throw new Error('narrow')
    expect(result.currentOwnerStaffId).toBe('stf_a1')
  })

  it('is idempotent when the same actor re-claims the case', async () => {
    const { caseId, deps } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const second = await claimCase({ caseId, actor: ANALYST }, deps)
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error('unreachable')
    expect(second.alreadyOwned).toBe(true)
  })

  it('refuses a claim from a non-staff actor (defense in depth)', async () => {
    const { caseId, deps } = await setup()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonStaff = { id: 'cus_1', role: 'customer' as any }
    const result = await claimCase({ caseId, actor: nonStaff }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('not_staff')
  })

  it('rejects when the case does not exist', async () => {
    const { deps } = await setup()
    const result = await claimCase({ caseId: 'cas_missing', actor: ANALYST }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('case_not_found')
  })
})

describe('claimCase — race condition', () => {
  it('only one claim wins when two actors race', async () => {
    const { caseId, deps } = await setup()
    const [a, b] = await Promise.all([
      claimCase({ caseId, actor: ANALYST }, deps),
      claimCase({ caseId, actor: OTHER }, deps),
    ])
    const wins = [a, b].filter((r) => r.ok).length
    expect(wins).toBe(1)
  })
})

describe('releaseCase', () => {
  it('clears ownership when the actor is the current owner + writes audit', async () => {
    const { caseId, deps, repo } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const result = await releaseCase({ caseId, actor: ANALYST }, deps)
    expect(result.ok).toBe(true)
    const c = await repo.findCase(caseId)
    expect(c?.ownerStaffId).toBeNull()
    const audit = await repo.listAudit(caseId)
    expect(audit.some((a) => a.kind === 'case.released')).toBe(true)
  })

  it('refuses release from a non-owner non-admin', async () => {
    const { caseId, deps } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const result = await releaseCase({ caseId, actor: OTHER }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('not_owner')
  })

  it('admin can force-release any case', async () => {
    const { caseId, deps } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const admin: ActorRef = { id: 'stf_admin', role: 'admin' }
    const result = await releaseCase({ caseId, actor: admin }, deps)
    expect(result.ok).toBe(true)
  })

  it('rejects release on an unowned case', async () => {
    const { caseId, deps } = await setup()
    const result = await releaseCase({ caseId, actor: ANALYST }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('not_claimed')
  })
})

describe('reassignCase', () => {
  it('coordinator can reassign ownership + writes audit', async () => {
    const { caseId, deps, repo } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const result = await reassignCase(
      { caseId, actor: COORD, toStaffId: 'stf_a2' },
      deps,
    )
    expect(result.ok).toBe(true)
    const c = await repo.findCase(caseId)
    expect(c?.ownerStaffId).toBe('stf_a2')
    const audit = await repo.listAudit(caseId)
    expect(audit.some((a) => a.kind === 'case.reassigned')).toBe(true)
  })

  it('admin can reassign ownership', async () => {
    const { caseId, deps } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const admin: ActorRef = { id: 'stf_admin', role: 'admin' }
    const result = await reassignCase(
      { caseId, actor: admin, toStaffId: 'stf_a2' },
      deps,
    )
    expect(result.ok).toBe(true)
  })

  it('analyst / validator CANNOT reassign', async () => {
    const { caseId, deps } = await setup()
    await claimCase({ caseId, actor: ANALYST }, deps)
    const r1 = await reassignCase(
      { caseId, actor: ANALYST, toStaffId: 'stf_a2' },
      deps,
    )
    expect(r1.ok).toBe(false)
    const r2 = await reassignCase(
      { caseId, actor: VALIDATOR, toStaffId: 'stf_a2' },
      deps,
    )
    expect(r2.ok).toBe(false)
  })

  it('can reassign an unowned case directly (no prior claim required)', async () => {
    const { caseId, deps, repo } = await setup()
    const result = await reassignCase(
      { caseId, actor: COORD, toStaffId: 'stf_new' },
      deps,
    )
    expect(result.ok).toBe(true)
    const c = await repo.findCase(caseId)
    expect(c?.ownerStaffId).toBe('stf_new')
  })
})
