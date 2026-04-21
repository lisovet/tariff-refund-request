import { OUTREACH_TEMPLATE_VERSION, type OutreachKitTemplate } from './types'

export const CARRIER_TEMPLATE: OutreachKitTemplate = {
  version: OUTREACH_TEMPLATE_VERSION,
  path: 'carrier',
  subject: 'IEEPA duty invoices — historical entries',
  body:
    'Hi {{importerName}},\n\n' +
    'For the carrier path you log into the carrier portal (DHL MyDHL+, FedEx eCustoms, UPS Quantum View) and pull every duty invoice ' +
    'for entries between {{windowStart}} and {{windowEnd}}. Export each invoice as a PDF or CSV and upload them through the secure portal below.\n\n' +
    'If multiple carriers handled your shipments, repeat the process for each one. The accepted formats are .pdf, .xlsx, and .csv.\n\n' +
    'Need help with a specific carrier — reply to this email and an analyst will walk you through it.',
  placeholders: ['importerName', 'windowStart', 'windowEnd'],
} as const
