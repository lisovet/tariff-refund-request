# ADR 014 — Custom CAPE schema + validator

**Status:** Accepted

## Context

The CAPE (Customs Automated Post-Entry) declaration file format is CBP-specific. There is no existing TypeScript library that models it, and the format includes business rules (entry-number canonicalization, duplicate detection, date-window validation, phase segmentation, batch grouping, ACE/ACH prerequisite flags) that are core product logic.

## Decision

Build a **first-class CAPE schema + validator** module in `src/contexts/cape/`.

- Schema as Zod (per ADR 009).
- Validator returns a typed `ReadinessReport` aggregating errors by severity (`blocking` / `warning` / `info`).
- CSV builder takes validated entries → outputs CBP-compliant CSV; rejects on any blocking error.
- Golden-file tests with anonymized real-shape fixtures committed to `tests/fixtures/cape/`.

## Consequences

- ✅ This module IS the product's defensible value — owning it is correct.
- ✅ Format changes from CBP land in one place.
- ⚠️ We must maintain the schema as CBP evolves it. Dedicate a quarterly review to CAPE format deltas.

## Test-impact

- Golden-file tests are non-negotiable — every fixture has an expected `ReadinessReport`.
- Mutation testing (Stryker) recommended for the validator once stable.
- `tests/fixtures/cape/` must contain at least: clean batch, duplicate-entry batch, mixed-phase batch, malformed-date batch, ACE-prerequisite-missing batch.
