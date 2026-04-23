import { describe, expect, it } from 'vitest'
import {
  AGREEMENTS,
  REQUIRED_CLAUSES,
  renderAgreement,
  resolveAgreement,
  type AgreementId,
  type AgreementVariables,
} from '../registry'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
} from '@shared/disclosure/constants'

const FIXTURE_VARS: AgreementVariables = {
  customerName: 'Pioneer Optics Corp',
  customerEmail: 'controller@pioneer-optics.test',
  caseId: 'cas_demo_1',
  effectiveDateIso: '2026-04-21',
  companyLegalName: 'Takemaya Software, Inc.',
  governingLawState: 'Delaware',
}

describe('AGREEMENTS registry', () => {
  it('exposes exactly one active version per customer-facing tier', () => {
    const ids = Object.keys(AGREEMENTS) as AgreementId[]
    // v1 covers the Full Prep engagement letter AND the
    // lightweight Audit clickwrap — the two-tier surface.
    expect(ids).toContain('audit-v1')
    expect(ids).toContain('full-prep-v1')
  })

  it('every entry has a non-empty body + a non-zero version number', () => {
    for (const [id, a] of Object.entries(AGREEMENTS)) {
      expect(a.id).toBe(id)
      expect(a.version).toBeGreaterThan(0)
      expect(a.body.length).toBeGreaterThan(200)
      expect(a.appliesTo.length).toBeGreaterThan(0)
    }
  })

  it('every entry declares exactly which SKU(s) it applies to', () => {
    const all = Object.values(AGREEMENTS).flatMap((a) => a.appliesTo)
    expect(all).toContain('audit')
    expect(all).toContain('full-prep')
  })
})

describe('resolveAgreement', () => {
  it('returns the agreement applicable to a given SKU', () => {
    const fullPrep = resolveAgreement('full-prep')
    expect(fullPrep.id).toBe('full-prep-v1')
    const audit = resolveAgreement('audit')
    expect(audit.id).toBe('audit-v1')
  })

  it('throws when no agreement is registered for the SKU', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => resolveAgreement('unknown-sku' as any)).toThrow(/no agreement/i)
  })
})

describe('REQUIRED_CLAUSES', () => {
  it('carries the four non-negotiable clauses every agreement must pass', () => {
    const ids = REQUIRED_CLAUSES.map((c) => c.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'not_legal_advice',
        'not_a_customs_broker',
        'canonical_trust_promise',
        'version_stamp',
      ]),
    )
  })
})

describe('every AGREEMENT passes its REQUIRED_CLAUSES', () => {
  for (const [id, a] of Object.entries(AGREEMENTS)) {
    describe(id, () => {
      for (const clause of REQUIRED_CLAUSES) {
        const applies = clause.applies(a.appliesTo)
        const action = applies ? 'contains' : 'is-exempt-from'
        it(`${action} ${clause.id}`, () => {
          if (applies) {
            expect(a.body).toMatch(clause.probe)
          } else {
            // No assertion — clause does not apply.
          }
        })
      }
    })
  }
})

describe('renderAgreement', () => {
  it('interpolates every {{VAR}} placeholder with the provided values', () => {
    const rendered = renderAgreement('full-prep-v1', FIXTURE_VARS)
    expect(rendered).toContain(FIXTURE_VARS.customerName)
    expect(rendered).toContain(FIXTURE_VARS.customerEmail)
    expect(rendered).toContain(FIXTURE_VARS.caseId)
    expect(rendered).toContain(FIXTURE_VARS.effectiveDateIso)
    expect(rendered).toContain(FIXTURE_VARS.companyLegalName)
    expect(rendered).toContain(FIXTURE_VARS.governingLawState)
    // No unresolved placeholders left behind.
    expect(rendered).not.toMatch(/\{\{[A-Z_]+\}\}/)
  })

  it('throws when an expected variable is missing (agreements must not ship with dangling placeholders)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => renderAgreement('full-prep-v1', {} as any)).toThrow(
      /missing variable/i,
    )
  })

  it('throws when the agreement id is unknown', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => renderAgreement('nope' as any, FIXTURE_VARS)).toThrow(
      /unknown agreement/i,
    )
  })

  it('Full Prep letter carries the canonical trust promise verbatim', () => {
    const rendered = renderAgreement('full-prep-v1', FIXTURE_VARS)
    expect(rendered).toContain(CANONICAL_TRUST_PROMISE)
  })

  it('Full Prep letter carries the "Not legal advice" language verbatim', () => {
    const rendered = renderAgreement('full-prep-v1', FIXTURE_VARS)
    expect(rendered).toContain(NOT_LEGAL_ADVICE_DISCLOSURE)
  })

  it('Full Prep letter stamps its own version id in the rendered output', () => {
    const rendered = renderAgreement('full-prep-v1', FIXTURE_VARS)
    expect(rendered).toContain('full-prep-v1')
  })

  it('Audit clickwrap stamps its own version id in the rendered output', () => {
    const rendered = renderAgreement('audit-v1', FIXTURE_VARS)
    expect(rendered).toContain('audit-v1')
  })
})

describe('renderAgreement — Full Prep scope + success fee + dispute', () => {
  it('names the success-fee mechanic (Full Prep gates the success-fee clause)', () => {
    const rendered = renderAgreement('full-prep-v1', FIXTURE_VARS)
    expect(rendered).toMatch(/success fee/i)
  })

  it('names the dispute resolution clause', () => {
    const rendered = renderAgreement('full-prep-v1', FIXTURE_VARS)
    expect(rendered).toMatch(/dispute/i)
  })

  it('names governing law with the interpolated state', () => {
    const rendered = renderAgreement('full-prep-v1', {
      ...FIXTURE_VARS,
      governingLawState: 'California',
    })
    expect(rendered).toMatch(/governed by the laws of California/i)
  })
})
