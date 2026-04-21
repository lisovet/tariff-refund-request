# Every entry record carries provenance and confidence

`EntryRecord` rows must always reference at least one `EntrySourceRecord`. We do not store entries without provenance.

## Forbidden patterns

- Inserting an `EntryRecord` with no `sourceRecordId`.
- Stripping or losing the `confidence` score during transformations.
- Silently choosing one source's value when sources disagree.
- Mock data or test fixtures that omit provenance fields.

## Required patterns

- Source-confidence inherits from the originating `RecoverySource`'s `path` (broker / carrier / ACE / mixed).
- Manual re-keys lower the confidence; analyst verification raises it.
- Multiple sources for the same entry strengthen the score and are kept (not collapsed).
- Conflicting fields across sources surface to ops as a "review pair" — never silently resolved.

## Why this matters

Provenance is what makes the Readiness Report defensible. A customer (or their broker) can trace any value back to the document it came from. AI extraction in Phase 2 only works if confidence calibration is honest.

## How to apply

- When designing schema migrations: provenance fields are not nullable.
- When writing extraction or normalization code: every output entry has a source link.
- When writing tests: fixtures include provenance.
- When auto-generating fake data for dev: include realistic provenance metadata.
