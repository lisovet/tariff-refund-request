/**
 * Ops context — public surface (UI-safe).
 *
 * Per ADR 008: XState types are kept private to `case-machine.ts`.
 * Callers see only the pure `CaseState`, `CaseEvent`, `nextState`,
 * `isValidTransition`, and `CASE_INITIAL_STATE` — no XState symbols
 * leak out, so the machine can be replaced or refactored without
 * disturbing consumers.
 */

export type {
  ActorRef,
  CaseEvent,
  CaseState,
  StaffRole,
} from './case-machine'
export {
  CASE_INITIAL_STATE,
  isValidTransition,
  nextState,
} from './case-machine'

export type {
  AuditEntry,
  CaseRecord,
  CaseRepo,
  NewCaseInput,
  RecordTransitionInput,
  RecordTransitionResult,
} from './repo'

export type {
  CaseTransitionedPayload,
  TransitionDeps,
  TransitionInput,
  TransitionResult,
} from './transition'
export { transition } from './transition'

export type { QueueFilter, QueueRow, SavedView, ViewerContext } from './queue'
export {
  SAVED_VIEWS,
  SLA_TARGETS_BY_STATE,
  computeQueueRow,
  filterQueue,
  resolveSavedView,
} from './queue'

export type {
  AssignmentDeps,
  ClaimCaseInput,
  ClaimCaseResult,
  ReassignCaseInput,
  ReassignCaseResult,
  ReleaseCaseInput,
  ReleaseCaseResult,
} from './assignment'
export { claimCase, reassignCase, releaseCase } from './assignment'
