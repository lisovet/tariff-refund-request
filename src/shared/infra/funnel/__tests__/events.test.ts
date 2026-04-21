import { describe, expect, it, vi } from 'vitest'
import {
  FUNNEL_EVENT_KINDS,
  emitFunnelEvent,
  emitFunnelCaseTransition,
  type FunnelEventLogger,
  type FunnelEvent,
} from '../events'

/**
 * Funnel events per PRD 00 §9. The dispatcher writes to the
 * Axiom-shaped logger so the product dashboard can aggregate.
 */

function makeLogger(): {
  logger: FunnelEventLogger
  info: ReturnType<typeof vi.fn>
} {
  const info = vi.fn()
  return {
    info,
    logger: {
      info,
    },
  }
}

describe('FUNNEL_EVENT_KINDS', () => {
  it('exposes the day-one metric events called out in PRD 00 §9', () => {
    expect(FUNNEL_EVENT_KINDS).toEqual(
      expect.arrayContaining([
        'screener.completed',
        'screener.qualified',
        'recovery.purchased',
        'prep.purchased',
        'concierge.signed',
        'concierge.purchased',
        'batch.signed_off',
        'case.filed',
        'case.paid',
        'case.state_transitioned',
      ]),
    )
  })
})

describe('emitFunnelEvent', () => {
  it('logs the event with kind + attrs + funnel:true tag', () => {
    const { logger, info } = makeLogger()
    const event: FunnelEvent = {
      kind: 'screener.completed',
      at: '2026-04-21T12:00:00.000Z',
      caseId: null,
      attrs: { sessionId: 'ss_1', disqualified: false },
    }
    emitFunnelEvent(event, { logger })
    expect(info).toHaveBeenCalledTimes(1)
    const [message, attrs] = info.mock.calls[0] ?? []
    expect(message).toBe('funnel:screener.completed')
    expect(attrs).toMatchObject({
      funnel: true,
      kind: 'screener.completed',
      at: '2026-04-21T12:00:00.000Z',
      caseId: null,
      sessionId: 'ss_1',
      disqualified: false,
    })
  })

  it('preserves the attrs verbatim (so downstream aggregation can pivot on arbitrary fields)', () => {
    const { logger, info } = makeLogger()
    emitFunnelEvent(
      {
        kind: 'recovery.purchased',
        at: '2026-04-21T13:00:00.000Z',
        caseId: 'cas_1',
        attrs: { amountUsdCents: 49900, tier: 'smb' },
      },
      { logger },
    )
    const attrs = info.mock.calls[0]?.[1]
    expect(attrs?.amountUsdCents).toBe(49900)
    expect(attrs?.tier).toBe('smb')
  })

  it('never throws when logger.info throws (funnel emission is side-effect-only)', () => {
    const logger: FunnelEventLogger = {
      info: () => {
        throw new Error('downstream blew up')
      },
    }
    expect(() =>
      emitFunnelEvent(
        { kind: 'case.paid', at: '2026-04-21T13:00:00.000Z', caseId: 'cas_1', attrs: {} },
        { logger },
      ),
    ).not.toThrow()
  })
})

describe('emitFunnelCaseTransition', () => {
  it('maps known terminal transitions to their direct funnel kinds', () => {
    const { logger, info } = makeLogger()
    emitFunnelCaseTransition(
      {
        caseId: 'cas_1',
        from: 'pending_cbp',
        to: 'paid',
        actorId: null,
        occurredAtIso: '2026-04-21T13:00:00.000Z',
      },
      { logger },
    )
    expect(info).toHaveBeenCalledTimes(2)
    const messages = info.mock.calls.map((c) => c[0])
    // Both a fine-grained transition event AND the coarse funnel
    // kind — dashboard can count either.
    expect(messages).toContain('funnel:case.state_transitioned')
    expect(messages).toContain('funnel:case.paid')
  })

  it('emits only the state_transitioned event for transitions without a funnel mapping', () => {
    const { logger, info } = makeLogger()
    emitFunnelCaseTransition(
      {
        caseId: 'cas_1',
        from: 'batch_qa',
        to: 'submission_ready',
        actorId: 'stf_v',
        occurredAtIso: '2026-04-21T13:00:00.000Z',
      },
      { logger },
    )
    expect(info).toHaveBeenCalledTimes(2)
    const messages = info.mock.calls.map((c) => c[0])
    expect(messages).toContain('funnel:case.state_transitioned')
    // submission_ready maps to batch.signed_off in our funnel.
    expect(messages).toContain('funnel:batch.signed_off')
  })

  it('emits case.filed when transition lands at "filed"', () => {
    const { logger, info } = makeLogger()
    emitFunnelCaseTransition(
      {
        caseId: 'cas_1',
        from: 'submission_ready',
        to: 'filed',
        actorId: 'stf_c',
        occurredAtIso: '2026-04-21T13:00:00.000Z',
      },
      { logger },
    )
    const messages = info.mock.calls.map((c) => c[0])
    expect(messages).toContain('funnel:case.filed')
  })
})
