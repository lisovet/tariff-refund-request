import { describe, expect, it, vi } from 'vitest'
import {
  STALLED_CADENCE_STAGES,
  stalledCadenceHandler,
  type StalledCadenceHandlerInput,
} from '../workflows/stalled-cadence'
import { createInMemoryCaseRepo } from '../in-memory-repo'

const RESUME_EVENT = {
  data: {
    caseId: 'cas_a',
    auditId: 'aud_x',
    kind: 'DOCS_UPLOADED_OR_CLAIMED',
    from: 'stalled',
    to: 'entry_recovery_in_progress',
    actorId: 'system',
    occurredAt: '2026-04-21T12:00:00Z',
  },
}

function makeInput(
  waitFor: Array<unknown | null>,
): StalledCadenceHandlerInput {
  let i = 0
  return {
    event: {
      data: {
        caseId: 'cas_a',
        auditId: 'aud_initial',
        kind: 'STALL_DETECTED',
        from: 'awaiting_docs',
        to: 'stalled',
        actorId: 'system',
        occurredAt: '2026-04-21T10:00:00Z',
      },
    },
    step: {
      run: vi.fn(async (_id: string, fn: () => unknown) => fn()) as unknown as StalledCadenceHandlerInput['step']['run'],
      waitForEvent: vi.fn(async () => {
        const v = waitFor[i] ?? null
        i++
        return v
      }) as unknown as StalledCadenceHandlerInput['step']['waitForEvent'],
    },
  }
}

describe('STALLED_CADENCE_STAGES', () => {
  it('exposes the v1 PRD-04 cadence: 48h, 96h, day-7', () => {
    expect(STALLED_CADENCE_STAGES.map((s) => s.id)).toEqual([
      'stalled-48h',
      'stalled-96h',
      'stalled-day-7',
    ])
    expect(STALLED_CADENCE_STAGES[0]?.timeout).toBe('48h')
    // 96h is total elapsed → 48h additional wait after the 48h fire.
    expect(STALLED_CADENCE_STAGES[1]?.timeout).toBe('48h')
    // Day 7 is total elapsed → 72h additional wait after the 96h fire.
    expect(STALLED_CADENCE_STAGES[2]?.timeout).toBe('72h')
  })
})

describe('stalledCadenceHandler — happy path (no resumption)', () => {
  it('fires all three nudges, writes one audit row per fire, returns delivered: 3', async () => {
    const repo = createInMemoryCaseRepo()
    const caseRecord = await repo.createCase({ tier: 'smb' })
    const input = makeInput([null, null, null])
    input.event.data.caseId = caseRecord.id

    const result = await stalledCadenceHandler(input, { repo })

    expect(result.delivered).toEqual(['stalled-48h', 'stalled-96h', 'stalled-day-7'])
    expect(result.cancelledBy).toBeNull()

    const audit = await repo.listAudit(caseRecord.id)
    const fires = audit.filter((a) => a.kind.startsWith('stalled_cadence:'))
    expect(fires).toHaveLength(3)
    expect(fires.map((f) => f.kind)).toEqual([
      'stalled_cadence:stalled-48h',
      'stalled_cadence:stalled-96h',
      'stalled_cadence:stalled-day-7',
    ])
  })

  it('writes audit rows with fromState=null and toState=null (non-state events)', async () => {
    const repo = createInMemoryCaseRepo()
    const caseRecord = await repo.createCase({ tier: 'smb' })
    const input = makeInput([null, null, null])
    input.event.data.caseId = caseRecord.id

    await stalledCadenceHandler(input, { repo })
    const audit = await repo.listAudit(caseRecord.id)
    for (const row of audit.filter((a) => a.kind.startsWith('stalled_cadence:'))) {
      expect(row.fromState).toBeNull()
      expect(row.toState).toBeNull()
    }
  })
})

describe('stalledCadenceHandler — cancellation', () => {
  it('stops at the first cadence when the case is resumed in the 48h window', async () => {
    const repo = createInMemoryCaseRepo()
    const caseRecord = await repo.createCase({ tier: 'smb' })
    const input = makeInput([RESUME_EVENT])
    input.event.data.caseId = caseRecord.id

    const result = await stalledCadenceHandler(input, { repo })

    expect(result.delivered).toEqual([])
    expect(result.cancelledBy).toBe('resumed-during-48h-window')
    expect((await repo.listAudit(caseRecord.id)).filter((a) => a.kind.startsWith('stalled_cadence:'))).toHaveLength(0)
  })

  it('stops at the second cadence when resumption arrives in the 96h window', async () => {
    const repo = createInMemoryCaseRepo()
    const caseRecord = await repo.createCase({ tier: 'smb' })
    const input = makeInput([null, RESUME_EVENT])
    input.event.data.caseId = caseRecord.id

    const result = await stalledCadenceHandler(input, { repo })
    expect(result.delivered).toEqual(['stalled-48h'])
    expect(result.cancelledBy).toBe('resumed-during-96h-window')
  })

  it('stops at day-7 when resumption arrives in the day-7 window', async () => {
    const repo = createInMemoryCaseRepo()
    const caseRecord = await repo.createCase({ tier: 'smb' })
    const input = makeInput([null, null, RESUME_EVENT])
    input.event.data.caseId = caseRecord.id

    const result = await stalledCadenceHandler(input, { repo })
    expect(result.delivered).toEqual(['stalled-48h', 'stalled-96h'])
    expect(result.cancelledBy).toBe('resumed-during-day-7-window')
  })
})

describe('stalledCadenceHandler — caseId scoping (filter expression)', () => {
  it('passes a filter on event.data.caseId so unrelated transitions do not cancel the cadence', async () => {
    const repo = createInMemoryCaseRepo()
    const caseRecord = await repo.createCase({ tier: 'smb' })
    const input = makeInput([null, null, null])
    input.event.data.caseId = caseRecord.id

    await stalledCadenceHandler(input, { repo })

    const calls = (input.step.waitForEvent as ReturnType<typeof vi.fn>).mock.calls
    expect(calls).toHaveLength(3)
    for (const call of calls) {
      const args = call[1] as { event: string; if?: string }
      expect(args.event).toBe('platform/case.state.transitioned')
      expect(args.if).toContain(`async.data.caseId == "${caseRecord.id}"`)
      expect(args.if).toContain('async.data.from == "stalled"')
    }
  })
})
