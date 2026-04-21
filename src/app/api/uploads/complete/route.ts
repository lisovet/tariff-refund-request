import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ACCEPTED_CONTENT_TYPES, completeUpload } from '@contexts/recovery'
import {
  getDocumentRepo,
  getRecoveryStorage,
} from '@contexts/recovery/server'
import { getErrorTracker, getLogger } from '@shared/infra/observability'

/**
 * POST /api/uploads/complete
 *
 * Body: { caseId, documentId, storageKey, filename, contentType, sha256 }
 *
 * Called by the client after the pre-signed PUT to R2 succeeds. The
 * server verifies the object actually landed (HEAD), then inserts the
 * document row using the size reported by the bucket (not the client).
 *
 * UNIQUE (case_id, sha256) means re-uploading the same content into
 * the same case is reported as `duplicate_sha256` with the existing
 * document — never a hard error.
 */

const BodySchema = z.object({
  caseId: z.string().min(1),
  documentId: z.string().min(1),
  storageKey: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.enum(ACCEPTED_CONTENT_TYPES),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
})

const ERROR_STATUS: Record<string, number> = {
  storage_key_mismatch: 400,
  object_not_uploaded: 409,
  sha256_invalid: 400,
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
    const result = await completeUpload(parsed, {
      storage: getRecoveryStorage(),
      documentRepo: getDocumentRepo(),
    })

    if (!result.ok) {
      log.warn('uploads.complete rejected', {
        error: result.error,
        caseId: parsed.caseId,
        documentId: parsed.documentId,
      })
      return NextResponse.json(
        { error: result.error },
        { status: ERROR_STATUS[result.error] ?? 400 },
      )
    }

    log.info('uploads.complete ok', {
      caseId: parsed.caseId,
      documentId: result.document.id,
      outcome: result.outcome,
    })
    return NextResponse.json({
      outcome: result.outcome,
      document: {
        id: result.document.id,
        caseId: result.document.caseId,
        storageKey: result.document.storageKey,
        filename: result.document.filename,
        contentType: result.document.contentType,
        byteSize: result.document.byteSize,
        sha256: result.document.sha256,
        uploadedBy: result.document.uploadedBy,
        createdAt: result.document.createdAt.toISOString(),
      },
    })
  } catch (err) {
    log.error('uploads.complete failed', { error: String(err) })
    tracker.captureException(err, { route: '/api/uploads/complete' })
    return NextResponse.json({ error: 'upload_complete_failed' }, { status: 500 })
  }
}
