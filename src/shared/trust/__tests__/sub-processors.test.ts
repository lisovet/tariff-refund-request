import { describe, expect, it } from 'vitest'
import {
  SUB_PROCESSORS,
  SUB_PROCESSORS_LIST_VERSION,
  SUB_PROCESSOR_PHASES,
  getActiveV1SubProcessors,
  type SubProcessor,
} from '../sub-processors'

/**
 * Sub-processor list — single source of truth for the /trust page,
 * the /trust/sub-processors page, and Phase-1 lifecycle notification
 * emails (PRD 10 §Sub-processors).
 *
 * Bumping the list version triggers the Phase-1 notification flow
 * — so the version number is a binding commitment, not a decorative
 * integer. Tests pin the invariants.
 */

describe('SUB_PROCESSORS — shape + invariants', () => {
  it('exposes a non-empty list', () => {
    expect(SUB_PROCESSORS.length).toBeGreaterThan(0)
  })

  it('every entry carries vendor, purpose, region, phase', () => {
    for (const s of SUB_PROCESSORS) {
      expect(s.vendor.length).toBeGreaterThan(0)
      expect(s.purpose.length).toBeGreaterThan(0)
      expect(s.region.length).toBeGreaterThan(0)
      expect(SUB_PROCESSOR_PHASES).toContain(s.phase)
    }
  })

  it('vendor names are unique (no accidental duplicates)', () => {
    const vendors = SUB_PROCESSORS.map((s) => s.vendor)
    expect(new Set(vendors).size).toBe(vendors.length)
  })

  it('every entry belongs to a known category', () => {
    const known = new Set([
      'infrastructure',
      'auth_payments',
      'workflow_comms',
      'observability',
      'ai_ocr',
    ])
    for (const s of SUB_PROCESSORS) {
      expect(known.has(s.category)).toBe(true)
    }
  })

  it('carries the v1 baseline sub-processors', () => {
    const vendors = SUB_PROCESSORS.map((s) => s.vendor)
    expect(vendors).toEqual(
      expect.arrayContaining([
        'Railway',
        'Cloudflare R2',
        'Clerk',
        'Stripe',
        'Inngest',
        'Resend',
        'Sentry',
        'Axiom',
      ]),
    )
  })

  it('Phase 2 AI / OCR vendors are present AND flagged as Phase 2 (not active v1)', () => {
    const anthropic = SUB_PROCESSORS.find((s) => s.vendor === 'Anthropic')
    expect(anthropic).toBeDefined()
    expect(anthropic?.phase).toBe('Phase 2')
  })
})

describe('SUB_PROCESSORS_LIST_VERSION', () => {
  it('is a positive integer (bumping it triggers lifecycle notifications)', () => {
    expect(Number.isInteger(SUB_PROCESSORS_LIST_VERSION)).toBe(true)
    expect(SUB_PROCESSORS_LIST_VERSION).toBeGreaterThanOrEqual(1)
  })
})

describe('getActiveV1SubProcessors', () => {
  it('returns only v1-phase entries (Phase 2 entries excluded)', () => {
    const active: readonly SubProcessor[] = getActiveV1SubProcessors()
    for (const s of active) {
      expect(s.phase).toBe('v1')
    }
  })

  it('includes the v1 baseline (Railway, Clerk, Stripe, ...)', () => {
    const active = getActiveV1SubProcessors().map((s) => s.vendor)
    expect(active).toEqual(
      expect.arrayContaining(['Railway', 'Clerk', 'Stripe']),
    )
  })
})
