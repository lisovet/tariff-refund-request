import { OUTREACH_TEMPLATE_VERSION, type OutreachKitTemplate } from './types'

export const MIXED_TEMPLATE: OutreachKitTemplate = {
  version: OUTREACH_TEMPLATE_VERSION,
  path: 'mixed',
  subject: 'IEEPA tariff entry collection — mixed clearance',
  body:
    'Hi {{importerName}},\n\n' +
    'Because your shipments cleared through more than one path (broker + carrier or ACE + broker), we will collect entries ' +
    'from each path you used. The workspace lets you upload documents from any source — broker 7501s, carrier invoices, and ACE exports ' +
    'are all accepted in the same case.\n\n' +
    'For the date range {{windowStart}} to {{windowEnd}}, an analyst will reconcile the entries across sources and flag any duplicates before the entry list is finalized.',
  placeholders: ['importerName', 'windowStart', 'windowEnd'],
} as const
