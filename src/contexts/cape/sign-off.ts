import type { ActorRef, CaseState } from '@contexts/ops'
import type {
  CaseRepo,
  TransitionDeps,
  TransitionInput,
  TransitionResult,
} from '@contexts/ops'
import type { ReadinessReport } from './schema'

/**
 * QA checklist + analyst sign-off gate per PRD 04 +
 * .claude/rules/human-qa-required.md.
 *
 * The gate has three non-bypassable checks. ALL must pass before
 * the case advances to `submission_ready`:
 *
 *   1. Every QA_CHECKLIST_ITEM is submitted AND checked.
 *   2. The readiness report has zero blocking issues.
 *   3. The actor submitting the sign-off has role === 'validator'.
 *
 * The third check is enforced twice: once at this service layer
 * (explicit error reason so the UI can show "you don't have
 * permission") and once inside the XState machine guard on
 * VALIDATOR_SIGNED_OFF (defense in depth — if a caller bypasses
 * this service, the machine still refuses).
 *
 * The note field is also required (non-empty). The sign-off
 * appears on the customer-facing Readiness Report; an unsigned
 * artifact without analyst reasoning would undermine the trust
 * posture.
 */

export interface QaChecklistItem {
  readonly id: string
  readonly label: string
  readonly description: string
}

export const QA_CHECKLIST_ITEMS: readonly QaChecklistItem[] = [
  {
    id: 'entries_match_source_documents',
    label: 'Every entry matches a source document',
    description:
      'Every row on the entry list is traceable to at least one uploaded document with verified provenance.',
  },
  {
    id: 'no_blocking_issues',
    label: 'No blocking issues remain',
    description:
      'The Readiness Report shows blockingCount=0. Any outstanding blocking issues must be resolved or the entries removed before sign-off.',
  },
  {
    id: 'prerequisites_reviewed',
    label: 'Prerequisites reviewed',
    description:
      'The prerequisite checklist (IOR, ACH, ACE access) has been reviewed and any gaps are explicitly called out in the customer email.',
  },
  {
    id: 'warnings_reviewed',
    label: 'Warnings reviewed',
    description:
      'Every warning-severity entry note has been read; the decision to ship despite each warning is recorded in the sign-off note.',
  },
  {
    id: 'csv_spot_checked',
    label: 'CSV spot-checked',
    description:
      'At least three rows of the generated CSV have been eyeballed against the source documents for correctness.',
  },
] as const

export interface ChecklistSubmission {
  readonly itemId: string
  readonly checked: boolean
}

export interface SignOffBatchInput {
  readonly caseId: string
  readonly batchId: string
  readonly actor: ActorRef
  readonly note: string
  readonly readinessReport: ReadinessReport
  readonly checklist: readonly ChecklistSubmission[]
}

export interface SignOffRecord {
  readonly staffUserId: string
  readonly signedAt: string
  readonly note: string
}

export type SignOffBatchResult =
  | {
      readonly ok: true
      readonly caseId: string
      readonly fromState: CaseState
      readonly toState: CaseState
      readonly auditId: string
      readonly signoff: SignOffRecord
    }
  | {
      readonly ok: false
      readonly reason: 'checklist_incomplete'
      readonly missingItems: readonly string[]
    }
  | {
      readonly ok: false
      readonly reason: 'blocking_issues_present'
      readonly blockingCount: number
    }
  | {
      readonly ok: false
      readonly reason: 'not_validator_role'
      readonly attemptedRole: string
    }
  | {
      readonly ok: false
      readonly reason: 'note_empty'
    }
  | {
      readonly ok: false
      readonly reason: 'transition_failed'
      readonly transitionReason:
        | 'case_not_found'
        | 'invalid_transition'
        | 'guard_rejected'
    }

export interface SignOffBatchDeps {
  readonly caseRepo: CaseRepo
  readonly transition: (
    input: TransitionInput,
    // Deps are pre-bound by the service; callers pass a
    // closed-over transition(input) that already knows about the
    // repo + the Inngest publisher.
    ...rest: never[]
  ) => Promise<TransitionResult>
  readonly clock: () => Date
}

export async function signOffBatch(
  input: SignOffBatchInput,
  deps: SignOffBatchDeps,
): Promise<SignOffBatchResult> {
  // Gate 1: actor role.
  if (input.actor.role !== 'validator') {
    return {
      ok: false,
      reason: 'not_validator_role',
      attemptedRole: input.actor.role,
    }
  }

  // Gate 2: note required.
  if (input.note.trim().length === 0) {
    return { ok: false, reason: 'note_empty' }
  }

  // Gate 3: blocking issues.
  if (input.readinessReport.blockingCount > 0) {
    return {
      ok: false,
      reason: 'blocking_issues_present',
      blockingCount: input.readinessReport.blockingCount,
    }
  }

  // Gate 4: checklist complete.
  const checkedIds = new Set(
    input.checklist.filter((c) => c.checked).map((c) => c.itemId),
  )
  const missing = QA_CHECKLIST_ITEMS.map((i) => i.id).filter(
    (id) => !checkedIds.has(id),
  )
  if (missing.length > 0) {
    return { ok: false, reason: 'checklist_incomplete', missingItems: missing }
  }

  // All gates passed — attempt the state transition. The machine's
  // VALIDATOR_SIGNED_OFF guard double-checks the role (defense in
  // depth).
  const transitionResult = await deps.transition({
    caseId: input.caseId,
    event: { type: 'VALIDATOR_SIGNED_OFF', actor: input.actor },
    actor: input.actor,
  })

  if (!transitionResult.ok) {
    return {
      ok: false,
      reason: 'transition_failed',
      transitionReason: transitionResult.reason,
    }
  }

  const signoff: SignOffRecord = {
    staffUserId: input.actor.id,
    signedAt: deps.clock().toISOString(),
    note: input.note,
  }

  // Additional audit row for the sign-off event (records the note +
  // checklist completion). The transition itself already wrote an
  // entry; this second row captures the sign-off details.
  const auditEntry = await deps.caseRepo.appendAuditEntry({
    caseId: input.caseId,
    actorId: input.actor.id,
    kind: 'qa.sign_off',
    payload: {
      batchId: input.batchId,
      note: input.note,
      checklistItemIds: QA_CHECKLIST_ITEMS.map((i) => i.id),
      readinessReportId: input.readinessReport.id,
    },
    occurredAt: deps.clock(),
  })

  return {
    ok: true,
    caseId: input.caseId,
    fromState: transitionResult.from,
    toState: transitionResult.to,
    auditId: auditEntry.auditId,
    signoff,
  }
}

// Unused import placeholder — TransitionDeps is re-exported by the
// ops context; we reference it to keep the dependency chain visible
// even though SignOffBatchDeps passes a pre-bound transition.
const _transitionDepsVisible: TransitionDeps | undefined = undefined
void _transitionDepsVisible
