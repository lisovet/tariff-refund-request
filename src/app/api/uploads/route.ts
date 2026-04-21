import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ACCEPTED_CONTENT_TYPES, prepareUpload } from '@contexts/recovery'
import { getRecoveryStorage } from '@contexts/recovery/server'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * POST /api/uploads
 *
 * Body: { caseId, filename, contentType, byteSize }
 *
 * Returns a 15-minute pre-signed PUT URL the client uses to upload
 * the file directly to R2. The document row is NOT created here —
 * see POST /api/uploads/complete which the client calls after the
 * PUT succeeds. This avoids orphan rows when uploads fail mid-flight.
 *
 * Auth: gated by middleware (PROTECTED_PREFIXES includes /api/uploads).
 * The client identity itself is stamped onto the document in the
 * complete step via the Actor resolver — for v1 customer uploads,
 * uploadedBy=customer with a null actorId since customer cases
 * aren't yet linked to Clerk users.
 */

const BodySchema = z.object({
  caseId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.enum(ACCEPTED_CONTENT_TYPES),
  byteSize: z.number().int().positive(),
})

const ERROR_STATUS: Record<string, number> = {
  caseId_invalid: 400,
  filename_invalid: 400,
  content_type_unsupported: 415,
  byte_size_invalid: 400,
  byte_size_too_large: 413,
}

export async function POST(req: Request): Promise<Response> {
  const log = getLogger()
  const tracker = getErrorTracker()

  let parsed: z.infer<typeof BodySchema>
  try {
    parsed = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: String(err) },
      { status: 400 },
    )
  }

  try {
    const result = await prepareUpload(parsed, {
      storage: getRecoveryStorage(),
    })

    if (!result.ok) {
      log.warn('uploads.prepare rejected', {
        error: result.error,
        caseId: parsed.caseId,
      })
      return NextResponse.json(
        { error: result.error },
        { status: ERROR_STATUS[result.error] ?? 400 },
      )
    }

    log.info('uploads.prepare ok', {
      caseId: parsed.caseId,
      documentId: result.documentId,
    })
    return NextResponse.json({
      documentId: result.documentId,
      storageKey: result.storageKey,
      uploadUrl: result.uploadUrl,
      expiresInSeconds: result.expiresInSeconds,
    })
  } catch (err) {
    log.error('uploads.prepare failed', { error: String(err) })
    tracker.captureException(err, { route: '/api/uploads' })
    return NextResponse.json({ error: 'upload_prepare_failed' }, { status: 500 })
  }
}
