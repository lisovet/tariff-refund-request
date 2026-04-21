import { OUTREACH_TEMPLATE_VERSION, type OutreachKitTemplate } from './types'

export const ACE_TEMPLATE: OutreachKitTemplate = {
  version: OUTREACH_TEMPLATE_VERSION,
  path: 'ace-self-export',
  subject: 'ACE entry export walkthrough',
  body:
    'Hi {{importerName}},\n\n' +
    'You have an ACE account, which is the cleanest path. Sign in at https://ace.cbp.dhs.gov, run the Entry Summary report ' +
    'for the date range {{windowStart}} to {{windowEnd}}, export as CSV, and upload it through the secure portal below.\n\n' +
    'Step-by-step screenshots are linked from the workspace. If you would prefer, an analyst can join a 30-minute screen-share ' +
    'and walk through the export with you — just reply to this email.',
  placeholders: ['importerName', 'windowStart', 'windowEnd'],
} as const
