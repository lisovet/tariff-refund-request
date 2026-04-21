import { OUTREACH_TEMPLATE_VERSION, type OutreachKitTemplate } from './types'

export const BROKER_TEMPLATE: OutreachKitTemplate = {
  version: OUTREACH_TEMPLATE_VERSION,
  path: 'broker',
  subject: 'Request for IEEPA tariff entry summaries',
  body:
    'Hi {{brokerName}},\n\n' +
    'We are working with {{importerName}} on an IEEPA tariff refund. ' +
    'Could you send the entry summaries (CBP Form 7501) for every entry filed under their importer of record number ' +
    'between {{windowStart}} and {{windowEnd}}? Please include any associated broker spreadsheets or reconciliation ' +
    'reports you produced for that period.\n\n' +
    'If a CSV export is easier than individual 7501 PDFs, that works too — we accept .pdf, .xlsx, .csv, and forwarded .eml.\n\n' +
    'Thank you,\n{{importerName}}',
  placeholders: ['brokerName', 'importerName', 'windowStart', 'windowEnd'],
} as const
