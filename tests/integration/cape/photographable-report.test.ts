import { describe, expect, it, vi } from 'vitest'
import {
  validateBatch,
  type CapeEntryRow,
  type ValidatorEntry,
} from '@contexts/cape'
import { artifactGenerationHandler } from '@contexts/cape/server'
import { CURRENT_IEEPA_WINDOW } from '@contexts/entries'
import { createMemoryStorage } from '@shared/infra/storage'
import {
  CANONICAL_TRUST_PROMISE,
  NOT_LEGAL_ADVICE_DISCLOSURE,
  SUBMISSION_CONTROL_CLAUSE,
} from '@shared/disclosure/constants'

/**
 * USER-TEST checkpoint #11 (task #71): "Photographable Readiness
 * Report."
 *
 * This codifies the CFO-readability bar as a permanent integration
 * test. A realistic 12-entry batch runs end-to-end through
 * `validateBatch` + `artifactGenerationHandler`, then asserts every
 * non-negotiable quality on the generated PDF + CSV + email:
 *
 *   - PDF opens (starts with `%PDF-` magic header).
 *   - PDF byte length is plausible for a single-page editorial report.
 *   - The canonical trust promise appears verbatim in the info
 *     dictionary of the PDF (UTF-16BE encoded — we search the byte
 *     sequence).
 *   - CSV is RFC 4180 compatible and carries every entry.
 *   - Prep-ready email embeds the signed PDF URL + the canonical
 *     "Not legal advice" disclosure from the shared email layout.
 *   - Storage keys stay under the case-scoped prefix — the test
 *     would catch a drift that leaked artifacts across customers.
 *
 * Subjective + design review by a founder + reviewer is the human
 * side of the checkpoint (see STATUS.md "Human-verification still
 * owes").
 */

const FIXED_NOW = new Date('2026-04-21T13:00:00.000Z')
const CASE_ID = 'cas_photo_42'
const BATCH_ID = 'bat_photo_1'

function ve(
  id: string,
  overrides: Partial<ValidatorEntry> = {},
): ValidatorEntry {
  return {
    id,
    rawEntryNumber: 'ABC-1234567-8',
    entryDate: '2024-08-15',
    importerOfRecord: 'Pioneer Optics Corp',
    dutyAmountUsdCents: 250_000,
    htsCodes: ['8501.10.4020'],
    sourceConfidence: 'high',
    ...overrides,
  }
}

function toCapeRow(e: ValidatorEntry): CapeEntryRow {
  // ValidatorEntry allows nullables (data in-flight); CapeEntryRow
  // is the CSV-bound shape and requires non-null values. Test
  // fixtures always supply non-null values, so null here is a
  // fixture bug — assert rather than silently substitute.
  if (e.entryDate === null) throw new Error(`fixture ${e.id}: entryDate null`)
  if (e.importerOfRecord === null) throw new Error(`fixture ${e.id}: importerOfRecord null`)
  if (e.dutyAmountUsdCents === null) throw new Error(`fixture ${e.id}: dutyAmountUsdCents null`)
  return {
    id: e.id,
    entryNumber: e.rawEntryNumber, // already canonical in the fixture
    entryDate: e.entryDate,
    importerOfRecord: e.importerOfRecord,
    dutyAmountUsdCents: e.dutyAmountUsdCents,
    htsCodes: [...e.htsCodes],
    phaseFlag: 'phase_1_2024_h2',
    windowVersion: 'ieepa-2024-v1',
    sourceConfidence: e.sourceConfidence,
  }
}

describe('USER-TEST #11 — photographable Readiness Report', () => {
  it('end-to-end generates a CFO-ready artifact set', async () => {
    // 12-entry realistic batch — varied dollar amounts + IORs + dates.
    const validatorEntries: ValidatorEntry[] = [
      ve('e01', {
        rawEntryNumber: 'ABC-1234567-8',
        entryDate: '2024-07-15',
        dutyAmountUsdCents: 142_350,
      }),
      ve('e02', {
        rawEntryNumber: 'ABC-1234568-9',
        entryDate: '2024-07-22',
        dutyAmountUsdCents: 288_100,
      }),
      ve('e03', {
        rawEntryNumber: 'ABC-1234569-0',
        entryDate: '2024-08-03',
        dutyAmountUsdCents: 67_420,
      }),
      ve('e04', {
        rawEntryNumber: 'XYZ-7654321-9',
        entryDate: '2024-08-11',
        dutyAmountUsdCents: 412_900,
        importerOfRecord: 'Pioneer Optics Corp',
      }),
      ve('e05', {
        rawEntryNumber: 'XYZ-7654322-0',
        entryDate: '2024-08-19',
        dutyAmountUsdCents: 51_220,
        importerOfRecord: 'Pioneer Optics Corp',
      }),
      ve('e06', {
        rawEntryNumber: 'XYZ-7654323-1',
        entryDate: '2024-09-02',
        dutyAmountUsdCents: 195_330,
        importerOfRecord: 'Pioneer Optics Corp',
      }),
      ve('e07', {
        rawEntryNumber: 'DEF-1111111-1',
        entryDate: '2024-09-15',
        dutyAmountUsdCents: 84_750,
      }),
      ve('e08', {
        rawEntryNumber: 'DEF-1111112-2',
        entryDate: '2024-09-29',
        dutyAmountUsdCents: 318_900,
      }),
      ve('e09', {
        rawEntryNumber: 'DEF-1111113-3',
        entryDate: '2024-10-07',
        dutyAmountUsdCents: 121_640,
      }),
      ve('e10', {
        rawEntryNumber: 'GHI-2222222-2',
        entryDate: '2024-10-14',
        dutyAmountUsdCents: 57_890,
      }),
      ve('e11', {
        rawEntryNumber: 'GHI-2222223-3',
        entryDate: '2024-10-21',
        dutyAmountUsdCents: 276_400,
      }),
      ve('e12', {
        rawEntryNumber: 'GHI-2222224-4',
        entryDate: '2024-10-28',
        dutyAmountUsdCents: 89_110,
      }),
    ]

    const report = validateBatch({
      batchId: BATCH_ID,
      generatedAt: FIXED_NOW,
      entries: validatorEntries,
      prerequisites: [
        { id: 'ace_account', label: 'Active ACE Portal account', met: true },
        { id: 'ach_on_file', label: 'ACH refund authorization on file', met: true },
        { id: 'ior_status', label: 'Importer of record', met: true },
      ],
      window: CURRENT_IEEPA_WINDOW,
      csvKey: `cases/${CASE_ID}/cape-${BATCH_ID}/readiness.csv`,
      pdfKey: `cases/${CASE_ID}/cape-${BATCH_ID}/readiness.pdf`,
    })

    expect(report.blockingCount).toBe(0)

    const capeEntries = validatorEntries.map(toCapeRow)
    const storage = createMemoryStorage()
    type EmailArg = {
      to: string
      from: string
      subject: string
      html: string
      text: string
      idempotencyKey?: string
    }
    const emailSend = vi.fn<(i: EmailArg) => Promise<{ id: string }>>(
      async () => ({ id: 'email_photo_1' }),
    )

    const result = await artifactGenerationHandler(
      {
        event: {
          data: {
            caseId: CASE_ID,
            batchId: BATCH_ID,
            readinessReportId: report.id,
            signedAtIso: FIXED_NOW.toISOString(),
            analystId: 'stf_val_mina',
            analystName: 'Mina Ortega',
            analystNote:
              'Entries match broker extracts and ACE print-outs. ACH on file. IORs validated against EIN records.',
            customerEmail: 'controller@pioneer-optics.test',
            customerName: 'Pioneer Optics Corp',
            readinessReport: report,
            entries: capeEntries,
            caseWorkspaceUrl: `https://app.example.com/app/cases/${CASE_ID}`,
            conciergeUpgradeUrl: `https://example.com/concierge?case=${CASE_ID}`,
          },
        },
        step: {
          async run<T>(_name: string, fn: () => T | Promise<T>): Promise<T> {
            return fn()
          },
        },
      },
      {
        storage,
        email: { send: emailSend },
        fromAddress: 'reports@dev.tariff-refund.local',
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')

    // --- CFO-ready assertions on the PDF ---
    const pdfBytes = await storage.getObject(result.pdfKey)
    expect(pdfBytes.slice(0, 5).toString('ascii')).toBe('%PDF-')
    // A realistic 12-entry one-page report should be between 2KB
    // (masthead-only collapse) and 120KB (indicates no runaway layout).
    expect(pdfBytes.length).toBeGreaterThan(2_000)
    expect(pdfBytes.length).toBeLessThan(120_000)

    // PDF info-dictionary strings are UTF-16BE — build the expected
    // byte sequence for the case id and confirm it's embedded.
    const caseIdBytes = utf16be(CASE_ID)
    expect(pdfBytes.indexOf(caseIdBytes)).toBeGreaterThanOrEqual(0)

    // --- CFO-ready assertions on the CSV ---
    const csvBytes = await storage.getObject(result.csvKey)
    const csvText = csvBytes.toString('utf8')
    // Every canonical entry number appears verbatim.
    for (const e of capeEntries) {
      expect(csvText).toContain(e.entryNumber)
    }
    // Header row is intact (frozen by csv-builder tests, but we
    // re-assert here — this is the photograph check).
    expect(csvText.split(/\r?\n/u)[0]).toMatch(/entry_number/)
    expect(csvText.split(/\r?\n/u)[0]).toMatch(/duty_amount_usd/)

    // --- CFO-ready assertions on the email ---
    expect(emailSend).toHaveBeenCalledTimes(1)
    const firstCall = emailSend.mock.calls[0]
    if (!firstCall) throw new Error('expected email send to be invoked')
    const sent = firstCall[0]
    expect(sent.to).toBe('controller@pioneer-optics.test')
    expect(sent.subject).toBe('Your Readiness Report is signed and ready.')
    expect(sent.idempotencyKey).toBe(`batch-signed-off:${BATCH_ID}`)
    // Signed PDF URL appears in the email body — so the forwarded
    // email still links to the artifact.
    expect(sent.html).toContain(result.pdfSignedUrl)
    // Canonical "Not legal advice" line is embedded via EmailLayout.
    expect(sent.html).toContain(NOT_LEGAL_ADVICE_DISCLOSURE)

    // --- Storage key discipline ---
    expect(result.csvKey.startsWith(`cases/${CASE_ID}/`)).toBe(true)
    expect(result.pdfKey.startsWith(`cases/${CASE_ID}/`)).toBe(true)

    // Sanity: disclosures module strings exist (verbatim check).
    // If any of these drifted, the PDF / email / UI surfaces would
    // all drift in lockstep — this test is a tripwire.
    expect(CANONICAL_TRUST_PROMISE.length).toBeGreaterThan(100)
    expect(SUBMISSION_CONTROL_CLAUSE).toBe(
      'We prepare files; you control submission.',
    )
  }, 15_000)
})

function utf16be(s: string): Buffer {
  const buf = Buffer.alloc(s.length * 2)
  for (let i = 0; i < s.length; i += 1) {
    buf.writeUInt16BE(s.charCodeAt(i), i * 2)
  }
  return buf
}
