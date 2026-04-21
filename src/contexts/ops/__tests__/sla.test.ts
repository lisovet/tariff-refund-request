import { describe, expect, it } from 'vitest'
import {
  SLA_BANDS,
  SLA_WARNING_PCT,
  computeSlaStatus,
  formatRemainingHumanized,
  type SlaStatus,
} from '../sla'

const H = 60 * 60 * 1000

describe('SLA_BANDS', () => {
  it('exposes the three canonical bands', () => {
    expect(SLA_BANDS).toEqual(['ok', 'warning', 'breach'])
  })
})

describe('SLA_WARNING_PCT', () => {
  it('warning threshold is 80% of the target (tune point for the palette)', () => {
    expect(SLA_WARNING_PCT).toBe(0.8)
  })
})

describe('computeSlaStatus — stateful states', () => {
  it('returns ok when elapsed is well below warning', () => {
    // batch_qa target is 24h; 1h elapsed is 4% → ok.
    const s = computeSlaStatus('batch_qa', 1 * H)
    expect(s.band).toBe('ok')
    expect(s.remainingMs).toBe(23 * H)
    expect(s.elapsedPctOfTarget).toBeCloseTo(1 / 24, 2)
  })

  it('returns warning when elapsed crosses SLA_WARNING_PCT but is still under target', () => {
    const s = computeSlaStatus('batch_qa', 21 * H) // 21/24 = 87.5%
    expect(s.band).toBe('warning')
    expect(s.remainingMs).toBe(3 * H)
  })

  it('returns breach when elapsed exceeds target', () => {
    const s = computeSlaStatus('batch_qa', 30 * H)
    expect(s.band).toBe('breach')
    expect(s.remainingMs).toBeLessThan(0)
  })

  it('exactly-at-target counts as ok (boundary favors positive status)', () => {
    // 24h exactly — still within SLA.
    const s = computeSlaStatus('batch_qa', 24 * H)
    expect(s.band).toBe('ok')
  })

  it('exactly-at-warning-threshold counts as warning', () => {
    const target = 24 * H
    const s = computeSlaStatus('batch_qa', Math.floor(target * 0.8))
    expect(s.band).toBe('warning')
  })
})

describe('computeSlaStatus — terminal / no-target states', () => {
  it('returns none band on a state with no SLA target', () => {
    const s = computeSlaStatus('closed', 10 * H)
    expect(s.band).toBe('none')
    expect(s.targetMs).toBeUndefined()
    expect(s.remainingMs).toBeUndefined()
  })

  it('paid + disqualified are also none', () => {
    expect(computeSlaStatus('paid', 100 * H).band).toBe('none')
    expect(computeSlaStatus('disqualified', 100 * H).band).toBe('none')
  })
})

describe('formatRemainingHumanized', () => {
  it('formats positive remaining as "Nd"/"Nh"/"Nm"', () => {
    expect(formatRemainingHumanized(2 * H)).toBe('2h')
    expect(formatRemainingHumanized(45 * 60 * 1000)).toBe('45m')
    expect(formatRemainingHumanized(50 * H)).toBe('2d')
  })

  it('formats negative remaining as overdue', () => {
    expect(formatRemainingHumanized(-3 * H)).toBe('3h overdue')
    expect(formatRemainingHumanized(-48 * H)).toBe('2d overdue')
    expect(formatRemainingHumanized(-30 * 60 * 1000)).toBe('30m overdue')
  })

  it('returns "—" when remaining is undefined (no SLA)', () => {
    expect(formatRemainingHumanized(undefined)).toBe('—')
  })
})

describe('SlaStatus type discriminator', () => {
  it('is a discriminated union on `band`', () => {
    const s: SlaStatus = computeSlaStatus('batch_qa', 0)
    if (s.band === 'none') {
      expect(s.targetMs).toBeUndefined()
    } else {
      expect(typeof s.targetMs).toBe('number')
    }
  })
})
