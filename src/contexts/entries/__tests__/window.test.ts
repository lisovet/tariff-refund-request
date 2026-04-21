import { describe, expect, it } from 'vitest'
import {
  CURRENT_IEEPA_WINDOW,
  IEEPA_WINDOWS,
  type IeepaWindow,
  tagEntry,
} from '../window'

describe('IEEPA_WINDOWS — versioned config', () => {
  it('exposes the current window with a stable version string', () => {
    expect(CURRENT_IEEPA_WINDOW.version).toMatch(/^ieepa-v\d+/)
    expect(CURRENT_IEEPA_WINDOW.startIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(CURRENT_IEEPA_WINDOW.endIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('phases tile the window contiguously without gaps or overlaps', () => {
    const phases = [...CURRENT_IEEPA_WINDOW.phases].sort((a, b) =>
      a.startIso.localeCompare(b.startIso),
    )
    expect(phases[0]?.startIso).toBe(CURRENT_IEEPA_WINDOW.startIso)
    expect(phases[phases.length - 1]?.endIso).toBe(CURRENT_IEEPA_WINDOW.endIso)
    for (let i = 1; i < phases.length; i++) {
      const prevEnd = new Date(`${phases[i - 1]?.endIso}T00:00:00Z`).getTime()
      const thisStart = new Date(`${phases[i]?.startIso}T00:00:00Z`).getTime()
      // The next phase starts the day after the previous one ends.
      expect(thisStart - prevEnd).toBe(86_400_000)
    }
  })

  it('every phase carries a unique id within the window', () => {
    const ids = CURRENT_IEEPA_WINDOW.phases.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('IEEPA_WINDOWS holds at least one window — current is a registered window', () => {
    const found = IEEPA_WINDOWS.find((w) => w.version === CURRENT_IEEPA_WINDOW.version)
    expect(found).toBeDefined()
  })
})

describe('tagEntry — happy paths', () => {
  it('tags an in-window entry with the matching phase id', () => {
    const result = tagEntry(
      { entryDate: CURRENT_IEEPA_WINDOW.phases[0]?.startIso ?? '2024-04-01' },
      CURRENT_IEEPA_WINDOW,
    )
    expect(result.inWindow).toBe(true)
    expect(result.windowVersion).toBe(CURRENT_IEEPA_WINDOW.version)
    expect(result.phaseFlag).toBe(CURRENT_IEEPA_WINDOW.phases[0]?.id)
  })

  it('tags an entry on the LAST day of the window as in-window', () => {
    const result = tagEntry(
      { entryDate: CURRENT_IEEPA_WINDOW.endIso },
      CURRENT_IEEPA_WINDOW,
    )
    expect(result.inWindow).toBe(true)
    expect(result.phaseFlag).toBe(
      CURRENT_IEEPA_WINDOW.phases[CURRENT_IEEPA_WINDOW.phases.length - 1]?.id,
    )
  })
})

describe('tagEntry — boundary dates', () => {
  it('tags the day BEFORE the window starts as out-of-window', () => {
    const dayBefore = previousDay(CURRENT_IEEPA_WINDOW.startIso)
    const result = tagEntry({ entryDate: dayBefore }, CURRENT_IEEPA_WINDOW)
    expect(result.inWindow).toBe(false)
    expect(result.phaseFlag).toBeNull()
  })

  it('tags the day AFTER the window ends as out-of-window', () => {
    const dayAfter = nextDay(CURRENT_IEEPA_WINDOW.endIso)
    const result = tagEntry({ entryDate: dayAfter }, CURRENT_IEEPA_WINDOW)
    expect(result.inWindow).toBe(false)
    expect(result.phaseFlag).toBeNull()
  })

  it('tags an entry at a phase boundary as the LATER phase (start-inclusive)', () => {
    const phases = CURRENT_IEEPA_WINDOW.phases
    if (phases.length < 2) return
    const secondPhase = phases[1] as IeepaWindow['phases'][number]
    const result = tagEntry({ entryDate: secondPhase.startIso }, CURRENT_IEEPA_WINDOW)
    expect(result.phaseFlag).toBe(secondPhase.id)
  })
})

describe('tagEntry — missing or invalid dates', () => {
  it('returns inWindow=false + phaseFlag=null when entryDate is null', () => {
    const result = tagEntry({ entryDate: null }, CURRENT_IEEPA_WINDOW)
    expect(result.inWindow).toBe(false)
    expect(result.phaseFlag).toBeNull()
    expect(result.windowVersion).toBe(CURRENT_IEEPA_WINDOW.version)
  })

  it('returns inWindow=false + phaseFlag=null when entryDate is malformed', () => {
    const result = tagEntry({ entryDate: 'August 2024' }, CURRENT_IEEPA_WINDOW)
    expect(result.inWindow).toBe(false)
    expect(result.phaseFlag).toBeNull()
  })
})

describe('tagEntry — version pinning', () => {
  it('always returns the version of the supplied window (so batch-level pinning works)', () => {
    const fakeOldWindow: IeepaWindow = {
      version: 'ieepa-v0-test',
      startIso: '2023-01-01',
      endIso: '2023-12-31',
      phases: [
        { id: 'phase_a', startIso: '2023-01-01', endIso: '2023-06-30', label: 'A' },
        { id: 'phase_b', startIso: '2023-07-01', endIso: '2023-12-31', label: 'B' },
      ],
    }
    const result = tagEntry({ entryDate: '2023-08-15' }, fakeOldWindow)
    expect(result.windowVersion).toBe('ieepa-v0-test')
    expect(result.phaseFlag).toBe('phase_b')
  })
})

// --- helpers --------------------------------------------------------

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function previousDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
