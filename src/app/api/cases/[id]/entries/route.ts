import { NextResponse } from 'next/server'
import { z } from 'zod'
import { saveExtractedEntry } from '@contexts/recovery'
import { getEntriesRepo } from '@contexts/recovery/server'
import { getCaseRepo } from '@contexts/ops/server'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * POST /api/cases/[id]/entries
 *
 * Body: {
 *   entryNumber, entryDate?, importerOfRecord?,
 *   dutyAmountUsdCents?, htsCodes?, phaseFlag?,
 *   recoverySourceId, rawData?
 * }
 *
 * Persists an analyst-extracted entry with a guaranteed-non-null
 * recovery source link and an audit_log row. Idempotent on
 * (caseId, entryNumber): the second save against the same number
 * attaches an additional source record rather than inserting a
 * duplicate (PRD 07 acceptance).
 *
 * Auth: middleware enforces a session for /api/cases/**. Per-case
 * staff-role scoping (analyst can only write to claimed cases)
 * lands with the ops queue work in #82+.
 */

const BodySchema = z.object({
  entryNumber: z.string().min(1).max(64),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  importerOfRecord: z.string().max(256).optional(),
  dutyAmountUsdCents: z.number().int().nonnegative().optional(),
  htsCodes: z.array(z.string().min(1).max(32)).max(20).optional(),
  phaseFlag: z.string().max(32).optional(),
  recoverySourceId: z.string().min(1),
  rawData: z.record(z.string(), z.unknown()).optional(),
})

interface RouteParams {
  readonly params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: RouteParams): Promise<Response> {
  const log = getLogger()
  const tracker = getErrorTracker()
  const { id: caseId } = await params

  let parsed: z.infer<typeof BodySchema>
  try {
    parsed = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: String(err) },
      { status: 400 },
    )
  }

  // Verify the case exists before we run the save (so a 404 is
  // returned rather than a foreign-key error from the repo).
  const caseRecord = await getCaseRepo().findCase(caseId)
  if (!caseRecord) {
    return NextResponse.json({ error: 'case_not_found' }, { status: 404 })
  }

  try {
    const result = await saveExtractedEntry(
      {
        caseId,
        entryNumber: parsed.entryNumber,
        entryDate: parsed.entryDate ?? null,
        importerOfRecord: parsed.importerOfRecord ?? null,
        dutyAmountUsdCents: parsed.dutyAmountUsdCents ?? null,
        htsCodes: parsed.htsCodes ?? [],
        phaseFlag: parsed.phaseFlag ?? null,
        recoverySourceId: parsed.recoverySourceId,
        actorId: null, // TODO(#82): resolve actor from session
        rawData: parsed.rawData ?? {},
      },
      {
        entriesRepo: getEntriesRepo(),
        caseRepo: getCaseRepo(),
      },
    )

    log.info('entries.save ok', {
      caseId,
      entryId: result.entry.id,
      outcome: result.outcome,
    })
    return NextResponse.json({
      outcome: result.outcome,
      entry: {
        id: result.entry.id,
        caseId: result.entry.caseId,
        entryNumber: result.entry.entryNumber,
        entryDate: result.entry.entryDate,
        dutyAmountUsdCents: result.entry.dutyAmountUsdCents,
        htsCodes: result.entry.htsCodes,
        createdAt: result.entry.createdAt.toISOString(),
      },
      sourceRecord: {
        id: result.sourceRecord.id,
        recoverySourceId: result.sourceRecord.recoverySourceId,
        confidence: result.sourceRecord.confidence,
      },
      auditId: result.auditId,
    })
  } catch (err) {
    log.error('entries.save failed', { error: String(err), caseId })
    tracker.captureException(err, { route: '/api/cases/[id]/entries' })
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }
}
