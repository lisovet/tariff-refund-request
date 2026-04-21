// Server-only in spirit (uses node:crypto), but the `server-only`
// directive lives on the umbrella entry `@contexts/screener/server`
// rather than here so this module remains importable in vitest.
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Magic-link tokens for screener-results resume. HMAC-SHA256 over
 * the JSON payload `{ sessionId, email, exp }`. URL-safe base64
 * encoding (no padding).
 *
 * Token shape: `<base64url(payload)>.<base64url(hmac)>`
 *
 * Per PRD 01: a token issued at q10 stays valid for 7 days.
 */

export interface MagicLinkPayload {
  readonly sessionId: string
  readonly email: string
}

export interface SignOptions {
  readonly secret: string
  readonly ttlSeconds: number
}

export interface VerifyOptions {
  readonly secret: string
}

export type VerifyResult =
  | { readonly ok: true; readonly payload: MagicLinkPayload }
  | { readonly ok: false; readonly reason: 'malformed' | 'bad_signature' | 'expired' }

interface InternalPayload extends MagicLinkPayload {
  readonly exp: number // unix-seconds expiry
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/')
  const padLen = (4 - (padded.length % 4)) % 4
  return Buffer.from(padded + '='.repeat(padLen), 'base64')
}

function sign(payloadEncoded: string, secret: string): string {
  return base64UrlEncode(
    createHmac('sha256', secret).update(payloadEncoded).digest(),
  )
}

export function signToken(
  payload: MagicLinkPayload,
  opts: SignOptions,
): string {
  if (opts.secret.length < 32) {
    throw new Error('magic-link secret must be ≥ 32 chars')
  }
  const exp = Math.floor(Date.now() / 1000) + opts.ttlSeconds
  const internal: InternalPayload = { ...payload, exp }
  const payloadEncoded = base64UrlEncode(JSON.stringify(internal))
  const sig = sign(payloadEncoded, opts.secret)
  return `${payloadEncoded}.${sig}`
}

export function verifyToken(
  token: string,
  opts: VerifyOptions,
): VerifyResult {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'malformed' }
  }
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'malformed' }
  const [payloadEncoded, providedSig] = parts as [string, string]

  const expectedSig = sign(payloadEncoded, opts.secret)
  // Constant-time compare.
  const expectedBuf = Buffer.from(expectedSig)
  const providedBuf = Buffer.from(providedSig)
  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return { ok: false, reason: 'bad_signature' }
  }

  let parsed: InternalPayload
  try {
    parsed = JSON.parse(base64UrlDecode(payloadEncoded).toString('utf8'))
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (
    typeof parsed.sessionId !== 'string' ||
    typeof parsed.email !== 'string' ||
    typeof parsed.exp !== 'number'
  ) {
    return { ok: false, reason: 'malformed' }
  }

  if (parsed.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  return {
    ok: true,
    payload: { sessionId: parsed.sessionId, email: parsed.email },
  }
}
