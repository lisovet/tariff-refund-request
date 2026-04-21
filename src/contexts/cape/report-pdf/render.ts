import { renderToBuffer } from '@react-pdf/renderer'
import {
  ReadinessReportDoc,
  type ReadinessReportDocProps,
} from './ReadinessReportDoc'

/**
 * Render the Readiness Report to a Node Buffer. Used by the
 * artifact-generation workflow to persist the PDF to R2 + stamp
 * the artifactKeys.pdfKey on the Readiness Report row.
 */
export async function renderReadinessReport(
  props: ReadinessReportDocProps,
): Promise<Buffer> {
  return renderToBuffer(ReadinessReportDoc(props))
}
