import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../memory'
import { caseScopedKey } from '../types'

/**
 * In-memory storage adapter — used by unit tests and as a dev fallback
 * when neither real R2 nor a local MinIO container is available.
 */

const sampleKey = caseScopedKey({
  caseId: 'case_test',
  documentId: 'doc_test',
  filename: 'sample.pdf',
})

describe('memory storage adapter', () => {
  it('round-trips put + get with byte-exact content', async () => {
    const storage = createMemoryStorage()
    const body = Buffer.from('hello, customs world')
    await storage.putObject(sampleKey, body, 'application/pdf')

    const fetched = await storage.getObject(sampleKey)
    expect(fetched.toString('utf8')).toBe('hello, customs world')
  })

  it('reports head correctly for present and missing keys', async () => {
    const storage = createMemoryStorage()
    expect((await storage.headObject(sampleKey)).exists).toBe(false)

    await storage.putObject(sampleKey, Buffer.from('x'))
    const head = await storage.headObject(sampleKey)
    expect(head.exists).toBe(true)
    expect(head.size).toBe(1)
  })

  it('issues a signed upload URL with bounded expiry (≤ 15 min per ADR 006)', async () => {
    const storage = createMemoryStorage()
    const url = await storage.getSignedUploadUrl(sampleKey, 'application/pdf', 900)
    expect(url).toMatch(/^memory:\/\/upload\//)
    expect(url).toContain(encodeURIComponent(sampleKey))
  })

  it('rejects upload-URL expiry beyond 15 minutes', async () => {
    const storage = createMemoryStorage()
    await expect(
      storage.getSignedUploadUrl(sampleKey, 'application/pdf', 901),
    ).rejects.toThrow(/expiry/i)
  })

  it('issues a signed read URL with bounded expiry', async () => {
    const storage = createMemoryStorage()
    await storage.putObject(sampleKey, Buffer.from('x'))
    const url = await storage.getSignedReadUrl(sampleKey, 600)
    expect(url).toMatch(/^memory:\/\/read\//)
  })

  it('refuses to sign a read URL for a missing object', async () => {
    const storage = createMemoryStorage()
    await expect(storage.getSignedReadUrl(sampleKey)).rejects.toThrow(/not found/i)
  })

  it('deletes objects', async () => {
    const storage = createMemoryStorage()
    await storage.putObject(sampleKey, Buffer.from('x'))
    await storage.deleteObject(sampleKey)
    expect((await storage.headObject(sampleKey)).exists).toBe(false)
  })

  it('preserves prior versions when an existing key is overwritten', async () => {
    // Per ADR 006: versioning enabled; we never overwrite a document.
    const storage = createMemoryStorage()
    await storage.putObject(sampleKey, Buffer.from('v1'))
    await storage.putObject(sampleKey, Buffer.from('v2'))
    const versions = storage.listVersions(sampleKey)
    expect(versions.length).toBe(2)
    expect(versions[0]?.body.toString()).toBe('v1')
    expect(versions[1]?.body.toString()).toBe('v2')
  })

  it('rejects keys that are not case-scoped (per ADR 006)', async () => {
    const storage = createMemoryStorage()
    await expect(storage.putObject('arbitrary/key', Buffer.from('x'))).rejects.toThrow(
      /case-scoped/i,
    )
  })
})
