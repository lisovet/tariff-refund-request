/**
 * Browser-side upload orchestrator.
 *
 *   1. hash the file (SHA-256, hex)
 *   2. POST /api/uploads to get a pre-signed PUT URL
 *   3. PUT the file directly to the bucket
 *   4. POST /api/uploads/complete to materialize the document row
 *
 * Pure orchestration — DOM-free; deps are injected so tests can swap
 * fetch + the bucket PUT. The component (UploadZone) wraps this with
 * UI state.
 */

export interface UploadedDocument {
  readonly id: string
  readonly caseId: string
  readonly storageKey: string
  readonly filename: string
  readonly contentType: string
  readonly byteSize: number
  readonly sha256: string
  readonly uploadedBy: 'customer' | 'staff' | 'system'
  readonly createdAt: string
}

export type UploadStage =
  | 'queued'
  | 'hashing'
  | 'uploading'
  | 'completing'
  | 'completed'
  | 'failed'

export interface UploadProgress {
  readonly stage: UploadStage
  /** 0–1 for stages that report progress (currently 'uploading' only). */
  readonly fraction?: number
  /** Set when stage is 'failed'. */
  readonly error?: string
}

export interface UploadInput {
  readonly caseId: string
  readonly file: File
}

export interface UploadDeps {
  readonly fetchFn: typeof fetch
  readonly hashFile: (file: File) => Promise<string>
  readonly putToBucket: (
    url: string,
    file: File,
    contentType: string,
  ) => Promise<{ ok: boolean; status?: number; statusText?: string }>
}

export type UploadResult =
  | {
      readonly ok: true
      readonly outcome: 'created' | 'duplicate_sha256'
      readonly document: UploadedDocument
    }
  | {
      readonly ok: false
      readonly stage: 'prepare' | 'put' | 'complete' | 'hash'
      readonly error: string
    }

export async function uploadFile(
  input: UploadInput,
  deps: UploadDeps,
  onProgress?: (event: UploadProgress) => void,
): Promise<UploadResult> {
  const emit = (e: UploadProgress) => onProgress?.(e)
  emit({ stage: 'queued' })

  let sha256: string
  try {
    emit({ stage: 'hashing' })
    sha256 = await deps.hashFile(input.file)
  } catch (err) {
    const error = String((err as Error)?.message ?? err)
    emit({ stage: 'failed', error })
    return { ok: false, stage: 'hash', error }
  }

  let prepared: {
    documentId: string
    storageKey: string
    uploadUrl: string
    expiresInSeconds: number
  }
  try {
    const res = await deps.fetchFn('/api/uploads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        caseId: input.caseId,
        filename: input.file.name,
        contentType: input.file.type,
        byteSize: input.file.size,
      }),
    })
    if (!res.ok) {
      const body = (await safeJson(res)) as { error?: string } | undefined
      const error = body?.error ?? `HTTP ${res.status}`
      emit({ stage: 'failed', error })
      return { ok: false, stage: 'prepare', error }
    }
    prepared = (await res.json()) as typeof prepared
  } catch (err) {
    const error = String((err as Error)?.message ?? err)
    emit({ stage: 'failed', error })
    return { ok: false, stage: 'prepare', error }
  }

  try {
    emit({ stage: 'uploading', fraction: 0 })
    const put = await deps.putToBucket(prepared.uploadUrl, input.file, input.file.type)
    if (!put.ok) {
      const error = `PUT ${put.status ?? '?'} ${put.statusText ?? ''}`.trim()
      emit({ stage: 'failed', error })
      return { ok: false, stage: 'put', error }
    }
    emit({ stage: 'uploading', fraction: 1 })
  } catch (err) {
    const error = String((err as Error)?.message ?? err)
    emit({ stage: 'failed', error })
    return { ok: false, stage: 'put', error }
  }

  try {
    emit({ stage: 'completing' })
    const res = await deps.fetchFn('/api/uploads/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        caseId: input.caseId,
        documentId: prepared.documentId,
        storageKey: prepared.storageKey,
        filename: input.file.name,
        contentType: input.file.type,
        sha256,
      }),
    })
    if (!res.ok) {
      const body = (await safeJson(res)) as { error?: string } | undefined
      const error = body?.error ?? `HTTP ${res.status}`
      emit({ stage: 'failed', error })
      return { ok: false, stage: 'complete', error }
    }
    const body = (await res.json()) as {
      outcome: 'created' | 'duplicate_sha256'
      document: UploadedDocument
    }
    emit({ stage: 'completed' })
    return { ok: true, outcome: body.outcome, document: body.document }
  } catch (err) {
    const error = String((err as Error)?.message ?? err)
    emit({ stage: 'failed', error })
    return { ok: false, stage: 'complete', error }
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return undefined
  }
}

/**
 * Default browser PUT to the bucket. Uses a real network fetch — the
 * tests inject a stub via UploadDeps.putToBucket.
 */
export async function defaultPutToBucket(
  url: string,
  file: File,
  contentType: string,
): Promise<{ ok: boolean; status?: number; statusText?: string }> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': contentType },
    body: file,
  })
  return { ok: res.ok, status: res.status, statusText: res.statusText }
}

/**
 * Default browser SHA-256 via WebCrypto. Reads the file with
 * arrayBuffer() — fine for files up to ~50 MB; the upload validator
 * enforces that cap server-side anyway.
 */
export async function defaultHashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return bytesToHex(new Uint8Array(digest))
}

function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += (bytes[i] ?? 0).toString(16).padStart(2, '0')
  }
  return out
}
