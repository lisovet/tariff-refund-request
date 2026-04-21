import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_KINDS,
  RECOVERY_PATHS,
  RECOVERY_SOURCE_CONFIDENCES,
  documents,
  recoverySources,
  schema,
} from '../schema'

const DRIZZLE_DIR = join(process.cwd(), 'drizzle')

describe('documents + recovery_sources Drizzle schema (task #44)', () => {
  it('registers documents + recoverySources on the global schema', () => {
    expect(schema.tables).toHaveProperty('documents')
    expect(schema.tables).toHaveProperty('recoverySources')
  })

  it('documents columns: id, caseId, storageKey, filename, contentType, byteSize, sha256, uploadedBy, uploadedByActorId, version, supersedesId, createdAt', () => {
    const cols = documents as unknown as Record<string, unknown>
    for (const col of [
      'id',
      'caseId',
      'storageKey',
      'filename',
      'contentType',
      'byteSize',
      'sha256',
      'uploadedBy',
      'uploadedByActorId',
      'version',
      'supersedesId',
      'createdAt',
    ]) {
      expect(cols).toHaveProperty(col)
    }
  })

  it('documents.uploadedBy is enum customer|staff|system', () => {
    const enumCol = (documents as unknown as {
      uploadedBy: { enumValues?: readonly string[] }
    }).uploadedBy
    expect(enumCol.enumValues).toEqual(
      expect.arrayContaining(['customer', 'staff', 'system']),
    )
  })

  it('recoverySources columns: id, caseId, path, kind, documentId, uploadedBy, uploadedByActorId, confidence, notes, createdAt', () => {
    const cols = recoverySources as unknown as Record<string, unknown>
    for (const col of [
      'id',
      'caseId',
      'path',
      'kind',
      'documentId',
      'uploadedBy',
      'uploadedByActorId',
      'confidence',
      'notes',
      'createdAt',
    ]) {
      expect(cols).toHaveProperty(col)
    }
  })

  it('recoverySources.path enum matches PRD 02 RecoveryPath', () => {
    const enumCol = (recoverySources as unknown as {
      path: { enumValues?: readonly string[] }
    }).path
    expect(enumCol.enumValues).toEqual(
      expect.arrayContaining(['broker', 'carrier', 'ace_self_export', 'mixed']),
    )
  })

  it('recoverySources.kind enum exposes the v1 document types', () => {
    const enumCol = (recoverySources as unknown as {
      kind: { enumValues?: readonly string[] }
    }).kind
    // Per PRD 07 source hierarchy.
    for (const kind of [
      'ace_export',
      'broker_7501',
      'broker_spreadsheet',
      'carrier_invoice',
      'paper_scan',
      'other',
    ]) {
      expect(enumCol.enumValues).toContain(kind)
    }
  })

  it('recoverySources.confidence enum is pending|verified|rejected', () => {
    const enumCol = (recoverySources as unknown as {
      confidence: { enumValues?: readonly string[] }
    }).confidence
    expect(enumCol.enumValues).toEqual(
      expect.arrayContaining(['pending', 'verified', 'rejected']),
    )
  })

  it('exposes typed enum constants for downstream consumers', () => {
    expect(DOCUMENT_KINDS).toContain('ace_export')
    expect(RECOVERY_PATHS).toContain('broker')
    expect(RECOVERY_SOURCE_CONFIDENCES).toContain('pending')
  })
})

describe('documents + recovery_sources migration', () => {
  function loadMigration(): string {
    const files = readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith('.sql'))
    const match = files.find((f) => /documents|recovery/i.test(f))
    if (!match) {
      throw new Error(
        `no documents/recovery migration found. Files: ${files.join(', ')}`,
      )
    }
    return readFileSync(join(DRIZZLE_DIR, match), 'utf8')
  }

  it('creates the documents table', () => {
    expect(loadMigration()).toMatch(
      /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?documents"?/i,
    )
  })

  it('creates the recovery_sources table', () => {
    expect(loadMigration()).toMatch(
      /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?recovery_sources"?/i,
    )
  })

  it('adds a UNIQUE constraint on documents.storage_key (one row per object)', () => {
    expect(loadMigration()).toMatch(
      /CONSTRAINT\s+"?documents_storage_key_unique"?\s+UNIQUE\s*\(\s*"?storage_key"?\s*\)/i,
    )
  })

  it('adds a UNIQUE constraint on (case_id, sha256) for content-hash dedupe', () => {
    expect(loadMigration()).toMatch(
      /CONSTRAINT\s+"?documents_case_sha256_unique"?\s+UNIQUE\s*\(\s*"?case_id"?\s*,\s*"?sha256"?\s*\)/i,
    )
  })
})
