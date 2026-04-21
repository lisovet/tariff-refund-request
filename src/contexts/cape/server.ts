import 'server-only'

/**
 * CAPE context — server-only surface.
 *
 * The UI-safe surface lives in `@contexts/cape` (pure schemas +
 * validator + CSV builder + grouping + sign-off service). Anything
 * that imports Inngest / object storage / React-PDF runtime lives
 * here and is only pulled into Next.js Node runtime code.
 */

export {
  artifactGenerationHandler,
  artifactGenerationWorkflow,
  type ArtifactGenerationHandlerDeps,
  type ArtifactGenerationHandlerInput,
  type ArtifactGenerationResult,
  type BatchSignedOffEventData,
} from './workflows/artifact-generation'

export { renderReadinessReport } from './report-pdf/render'
export {
  ReadinessReportDoc,
  DISCLOSURE_FOOTNOTE,
  type ReadinessReportBody,
  type ReadinessReportDocProps,
} from './report-pdf/ReadinessReportDoc'
