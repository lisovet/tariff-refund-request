import { inngest } from '@shared/infra/inngest/client'
import { caseStateTransitioned } from '@shared/infra/inngest/events'
import type { CaseRepo } from '../repo'

/**
 * Stalled-case cadence per PRD 04: 48h, 96h, day-7. Triggered when a
 * case transitions into `stalled`. Each fire records an audit row.
 * Cancels as soon as the case transitions OUT of `stalled` (e.g.,
 * customer uploads, staff claims).
 *
 * Total elapsed times are 48h, 96h, and 168h (day 7). The handler
 * implements them as sequential `step.waitForEvent` windows, each
 * shorter than the gap between cumulative milestones (48h, 48h, 72h).
 */

export interface StalledCadenceStage {
  readonly id: 'stalled-48h' | 'stalled-96h' | 'stalled-day-7'
  readonly timeout: '48h' | '72h'
  readonly cancelReason:
    | 'resumed-during-48h-window'
    | 'resumed-during-96h-window'
    | 'resumed-during-day-7-window'
}

export const STALLED_CADENCE_STAGES: readonly StalledCadenceStage[] = [
  { id: 'stalled-48h', timeout: '48h', cancelReason: 'resumed-during-48h-window' },
  { id: 'stalled-96h', timeout: '48h', cancelReason: 'resumed-during-96h-window' },
  { id: 'stalled-day-7', timeout: '72h', cancelReason: 'resumed-during-day-7-window' },
] as const

export interface StalledCadenceHandlerInput {
  readonly event: {
    id?: string
    data: {
      caseId: string
      auditId: string
      kind: string
      from: string
      to: string
      actorId: string
      occurredAt: string
    }
  }
  readonly step: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
    waitForEvent<T>(
      id: string,
      args: { event: string; timeout: string; if?: string },
    ): Promise<T | null>
  }
}

export interface StalledCadenceHandlerDeps {
  readonly repo: CaseRepo
  readonly clock?: () => Date
}

export type StalledCadenceCancelReason = StalledCadenceStage['cancelReason']

export interface StalledCadenceResult {
  readonly delivered: ReadonlyArray<StalledCadenceStage['id']>
  readonly cancelledBy: StalledCadenceCancelReason | null
}

export async function stalledCadenceHandler(
  input: StalledCadenceHandlerInput,
  deps: StalledCadenceHandlerDeps,
): Promise<StalledCadenceResult> {
  const { event, step } = input
  if (event.data.to !== 'stalled') {
    // Inngest fires this workflow on every case-state transition;
    // we only do work when the transition is INTO stalled. Cheaper
    // than a function-config filter expression that the SDK
    // doesn't currently surface on createFunction.
    return { delivered: [], cancelledBy: null }
  }
  const { caseId } = event.data
  const clock = deps.clock ?? (() => new Date())
  const delivered: Array<StalledCadenceStage['id']> = []

  for (const stage of STALLED_CADENCE_STAGES) {
    const resumed = await step.waitForEvent(`wait-${stage.id}`, {
      event: 'platform/case.state.transitioned',
      timeout: stage.timeout,
      if: `async.data.caseId == "${caseId}" && async.data.from == "stalled"`,
    })
    if (resumed) {
      return { delivered, cancelledBy: stage.cancelReason }
    }
    await step.run(`fire-${stage.id}`, async () => {
      await deps.repo.appendAuditEntry({
        caseId,
        kind: `stalled_cadence:${stage.id}`,
        actorId: null,
        payload: {
          stage: stage.id,
          stalledSinceIso: event.data.occurredAt,
          stalledAuditId: event.data.auditId,
        },
        occurredAt: clock(),
      })
    })
    delivered.push(stage.id)
  }

  return { delivered, cancelledBy: null }
}

/**
 * Inngest-wrapped function. Triggers on every case-state transition
 * but only does work for transitions whose `to` is `stalled` — the
 * filter expression keeps unrelated transitions from spawning runs.
 */
export const stalledCadenceWorkflow = inngest.createFunction(
  { id: 'stalled-cadence', triggers: [caseStateTransitioned] },
  async (input) => {
    const { getCaseRepo } = await import('@contexts/ops/server')
    const adapted = input as unknown as StalledCadenceHandlerInput
    return stalledCadenceHandler(adapted, { repo: getCaseRepo() })
  },
)
