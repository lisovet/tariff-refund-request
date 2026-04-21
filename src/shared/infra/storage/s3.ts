import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  DEFAULT_READ_URL_EXPIRY_SECONDS,
  MAX_READ_URL_EXPIRY_SECONDS,
  MAX_UPLOAD_URL_EXPIRY_SECONDS,
  type StorageAdapter,
  type StorageKey,
  isStorageKey,
} from './types'

/**
 * S3-compatible storage adapter. Works against Cloudflare R2 (production),
 * MinIO (local dev / CI integration), or AWS S3 (escape hatch).
 *
 * Per ADR 006: R2 is the chosen store (S3-compatible API + zero egress
 * fees, which matters when the Phase 2 OCR pipeline re-reads documents).
 * Versioning is enabled at the bucket level via console/Terraform.
 */

export interface S3StorageConfig {
  readonly accessKeyId: string
  readonly secretAccessKey: string
  readonly endpoint: string
  readonly bucket: string
  readonly region?: string
}

export function createS3Storage(config: S3StorageConfig): StorageAdapter {
  const client = new S3Client({
    region: config.region ?? 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // R2 + MinIO compatibility
  })

  function assertCaseScoped(key: StorageKey): void {
    if (!isStorageKey(key)) {
      throw new Error(`storage key must be case-scoped: ${key}`)
    }
  }

  return {
    async putObject(key, body, contentType) {
      assertCaseScoped(key)
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      )
    },

    async getObject(key) {
      assertCaseScoped(key)
      const response = await client.send(
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      )
      if (!response.Body) throw new Error(`object not found: ${key}`)
      const bytes = await response.Body.transformToByteArray()
      return Buffer.from(bytes)
    },

    async deleteObject(key) {
      assertCaseScoped(key)
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
      )
    },

    async headObject(key) {
      assertCaseScoped(key)
      try {
        const response = await client.send(
          new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
        )
        return { exists: true, size: response.ContentLength }
      } catch (err) {
        if ((err as { name?: string }).name === 'NotFound') {
          return { exists: false }
        }
        throw err
      }
    },

    async getSignedUploadUrl(key, contentType, expirySeconds = MAX_UPLOAD_URL_EXPIRY_SECONDS) {
      assertCaseScoped(key)
      if (expirySeconds > MAX_UPLOAD_URL_EXPIRY_SECONDS) {
        throw new Error(
          `upload URL expiry must be ≤ ${MAX_UPLOAD_URL_EXPIRY_SECONDS}s`,
        )
      }
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: expirySeconds },
      )
    },

    async getSignedReadUrl(key, expirySeconds = DEFAULT_READ_URL_EXPIRY_SECONDS) {
      assertCaseScoped(key)
      if (expirySeconds > MAX_READ_URL_EXPIRY_SECONDS) {
        throw new Error(
          `read URL expiry must be ≤ ${MAX_READ_URL_EXPIRY_SECONDS}s`,
        )
      }
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: expirySeconds },
      )
    },
  }
}
