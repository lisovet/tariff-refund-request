// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  AuditTimeline,
  type AuditTimelineEntry,
} from '../AuditTimeline'

const TRANSITION: AuditTimelineEntry = {
  id: 'aud_1',
  kind: 'SCREENER_RESULT_QUALIFIED',
  actorId: null,
  fromState: 'new_lead',
  toState: 'qualified',
  occurredAtIso: '2026-04-21T12:00:00.000Z',
  payload: { type: 'SCREENER_RESULT_QUALIFIED' },
}

const NOTE: AuditTimelineEntry = {
  id: 'aud_2',
  kind: 'admin.note',
  actorId: 'stf_mina',
  fromState: null,
  toState: null,
  occurredAtIso: '2026-04-21T13:00:00.000Z',
  payload: { note: 'Called customer; awaiting ACE print-outs.' },
}

const DELETION: AuditTimelineEntry = {
  id: 'aud_3',
  kind: 'customer.deleted',
  actorId: null,
  fromState: null,
  toState: null,
  occurredAtIso: '2026-04-21T14:00:00.000Z',
  payload: {
    kind: 'customer.deleted',
    customerId: 'cus_x',
    deletionRequestId: 'ddel_x',
    counts: { casesDeleted: 2, auditRowsDeleted: 5 },
  },
}

describe('AuditTimeline', () => {
  it('renders one row per entry in chronological order (earliest → latest)', () => {
    render(<AuditTimeline entries={[NOTE, TRANSITION, DELETION]} />)
    const rows = screen.getAllByTestId('audit-row')
    expect(rows).toHaveLength(3)
    // Sorted by occurredAtIso ascending.
    expect(rows[0]?.getAttribute('data-audit-id')).toBe('aud_1')
    expect(rows[1]?.getAttribute('data-audit-id')).toBe('aud_2')
    expect(rows[2]?.getAttribute('data-audit-id')).toBe('aud_3')
  })

  it('renders the fromState → toState pair for transition rows', () => {
    render(<AuditTimeline entries={[TRANSITION]} />)
    expect(screen.getByText('new_lead')).toBeTruthy()
    expect(screen.getByText('qualified')).toBeTruthy()
    // Arrow separator between states.
    expect(screen.getByText('→')).toBeTruthy()
  })

  it('does NOT render a transition pair for non-transition entries', () => {
    render(<AuditTimeline entries={[NOTE]} />)
    expect(screen.queryByText('→')).toBeNull()
  })

  it('renders the actor id for staff-actor rows', () => {
    render(<AuditTimeline entries={[NOTE]} />)
    expect(screen.getByText(/stf_mina/i)).toBeTruthy()
  })

  it('renders "system" (not a blank) when actor is null', () => {
    render(<AuditTimeline entries={[TRANSITION]} />)
    expect(screen.getByText(/system/i)).toBeTruthy()
  })

  it('renders the kind on every row as a mono uppercase tag', () => {
    render(<AuditTimeline entries={[TRANSITION, NOTE]} />)
    expect(screen.getByText('SCREENER_RESULT_QUALIFIED')).toBeTruthy()
    expect(screen.getByText('admin.note')).toBeTruthy()
  })

  it('renders the ISO timestamp (date + time) for every row', () => {
    render(<AuditTimeline entries={[NOTE]} />)
    expect(screen.getByText(/2026-04-21/)).toBeTruthy()
    expect(screen.getByText(/13:00/)).toBeTruthy()
  })

  it('renders the deletion payload counts — content-free — when present', () => {
    render(<AuditTimeline entries={[DELETION]} />)
    // Counts appear but NOT any PII: the deletion audit row only
    // carries ids + counts per PRD 10.
    expect(screen.getByText(/2 cases/)).toBeTruthy()
    expect(screen.getByText(/5 audit/)).toBeTruthy()
  })

  it('renders an empty-state message when no entries', () => {
    render(<AuditTimeline entries={[]} />)
    expect(screen.getByText(/no audit events yet/i)).toBeTruthy()
  })

  it('renders notes as secondary-line text on admin-note rows', () => {
    render(<AuditTimeline entries={[NOTE]} />)
    expect(
      screen.getByText(/awaiting ACE print-outs/i),
    ).toBeTruthy()
  })
})
