/**
 * Generate a photographable sample Readiness Report PDF. Writes to
 * `./tmp/readiness-report-sample.pdf` so a human reviewer can open it
 * and evaluate the "CFO-would-forward-this-unchanged" bar (task #71
 * USER-TEST checkpoint).
 *
 * Usage:
 *   npx tsx scripts/generate-sample-readiness-report.ts
 *   open tmp/readiness-report-sample.pdf
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { renderReadinessReport } from '../src/contexts/cape/report-pdf/render'
import type { EntryTableRow } from '../src/contexts/cape/report-pdf/EntryTable'

const OUT_DIR = join(process.cwd(), 'tmp')
const OUT_PATH = join(OUT_DIR, 'readiness-report-sample.pdf')

const ENTRIES: EntryTableRow[] = [
  { id: 'e01', entryNumber: 'ABC-1234567-8', entryDate: '2024-07-15', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 142_350, status: 'ok', notes: [] },
  { id: 'e02', entryNumber: 'ABC-1234568-9', entryDate: '2024-07-22', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 288_100, status: 'ok', notes: [] },
  { id: 'e03', entryNumber: 'ABC-1234569-0', entryDate: '2024-08-03', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 67_420, status: 'ok', notes: [] },
  { id: 'e04', entryNumber: 'XYZ-7654321-9', entryDate: '2024-08-11', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 412_900, status: 'warning', notes: ['Source confidence medium — reconciled against single broker extract.'] },
  { id: 'e05', entryNumber: 'XYZ-7654322-0', entryDate: '2024-08-19', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 51_220, status: 'ok', notes: [] },
  { id: 'e06', entryNumber: 'XYZ-7654323-1', entryDate: '2024-09-02', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 195_330, status: 'ok', notes: [] },
  { id: 'e07', entryNumber: 'DEF-1111111-1', entryDate: '2024-09-15', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 84_750, status: 'ok', notes: [] },
  { id: 'e08', entryNumber: 'DEF-1111112-2', entryDate: '2024-09-29', importerOfRecord: 'Pioneer Optics Corp', dutyAmountUsdCents: 318_900, status: 'ok', notes: [] },
]

async function main(): Promise<void> {
  const buf = await renderReadinessReport({
    caseId: 'cas_photo_sample',
    customerName: 'Pioneer Optics Corp',
    generatedAtIso: new Date().toISOString(),
    analystName: 'Mina Ortega',
    body: {
      totalEntries: ENTRIES.length,
      blockingCount: 0,
      warningCount: 1,
      infoCount: 0,
      entryRows: ENTRIES,
      prerequisites: [
        { id: 'ace_account', label: 'Active ACE Portal account', met: true },
        { id: 'ach_on_file', label: 'ACH refund authorization on file', met: true },
        { id: 'ior_status', label: 'Importer of record verified', met: true },
      ],
      signoff: {
        analystName: 'Mina Ortega',
        signedAtIso: new Date().toISOString(),
        note:
          'Entries match broker extracts and ACE print-outs. ACH on file. IORs validated against EIN records.',
      },
      footnotes: [
        { id: 'fn_estimates', body: 'Estimates are based on the information you provided.' },
        { id: 'fn_cbp', body: 'Refund timing depends on CBP review.' },
      ],
    },
  })

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(OUT_PATH, buf)
  process.stdout.write(`wrote ${OUT_PATH} (${buf.length} bytes)\n`)
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
  process.exit(1)
})
