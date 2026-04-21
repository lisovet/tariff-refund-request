// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderEmail } from '../../render'
import { ConciergeUpsellEmail } from '../ConciergeUpsellEmail'
import { EntryListReadyEmail } from '../EntryListReadyEmail'
import { PrepReadyEmail } from '../PrepReadyEmail'
import { RecoveryMissingDocsEmail } from '../RecoveryMissingDocsEmail'
import { RecoveryPurchasedEmail } from '../RecoveryPurchasedEmail'
import { ReengagementEmail } from '../ReengagementEmail'

const CASE_URL = 'https://app.example.test/app/case/case_x'
const REPORT_URL = 'https://app.example.test/app/case/case_x/readiness-report'

async function expectsDisclosure(node: React.ReactElement) {
  const out = await renderEmail(node)
  expect(out.html).toMatch(/<html/i)
  // Canonical disclosure rides on every template via EmailLayout.
  expect(out.html).toMatch(/Not legal advice/)
  expect(out.text).toMatch(/Not legal advice/)
  return out
}

describe('RecoveryPurchasedEmail', () => {
  it('greets by first name and links to the workspace', async () => {
    const out = await expectsDisclosure(
      <RecoveryPurchasedEmail
        firstName="Alex"
        caseUrl={CASE_URL}
      />,
    )
    expect(out.html).toMatch(/Alex/)
    expect(out.html).toContain(CASE_URL)
    expect(out.html).toMatch(/Recovery/i)
  })
})

describe('RecoveryMissingDocsEmail', () => {
  it('mentions a 15-minute call offer (per PRD 05 lifecycle #5)', async () => {
    const out = await expectsDisclosure(
      <RecoveryMissingDocsEmail
        firstName="Alex"
        caseUrl={CASE_URL}
        scheduleCallUrl="https://cal.com/example/15min"
      />,
    )
    expect(out.text).toMatch(/15.{0,10}minute/i)
    expect(out.html).toContain('https://cal.com/example/15min')
  })
})

describe('EntryListReadyEmail', () => {
  it('celebrates restrained + points at Prep as the next step', async () => {
    const out = await expectsDisclosure(
      <EntryListReadyEmail
        firstName="Alex"
        caseUrl={CASE_URL}
        entryCount={42}
      />,
    )
    expect(out.html).toMatch(/Entry list/i)
    expect(out.html).toMatch(/42/)
    expect(out.html).toContain(CASE_URL)
  })
})

describe('PrepReadyEmail', () => {
  it('delivers the Readiness Report link and offers Concierge as upsell', async () => {
    const out = await expectsDisclosure(
      <PrepReadyEmail
        firstName="Alex"
        readinessReportUrl={REPORT_URL}
        conciergeUpgradeUrl="https://app.example.test/app/case/case_x/concierge"
      />,
    )
    expect(out.html).toContain(REPORT_URL)
    expect(out.html).toMatch(/concierge/i)
  })
})

describe('ConciergeUpsellEmail', () => {
  it('frames concierge in plain language with a single CTA', async () => {
    const out = await expectsDisclosure(
      <ConciergeUpsellEmail
        firstName="Alex"
        conciergePurchaseUrl="https://app.example.test/app/case/case_x/concierge/checkout"
      />,
    )
    expect(out.html).toMatch(/Concierge/i)
    expect(out.html).toContain(
      'https://app.example.test/app/case/case_x/concierge/checkout',
    )
  })
})

describe('ReengagementEmail', () => {
  it('offers a soft re-entry to a stalled case', async () => {
    const out = await expectsDisclosure(
      <ReengagementEmail firstName="Alex" caseUrl={CASE_URL} />,
    )
    expect(out.text).toMatch(/picking up/i)
    expect(out.html).toContain(CASE_URL)
  })
})
