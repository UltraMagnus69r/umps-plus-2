/**
 * Phase 16.1 — Status indicators (Ready / Needs name / Processing).
 * Maps existing workflow + async store signals only; no parallel business rules.
 * Studio redesign: readiness is separate from Saved / Unsaved design state.
 */

import type { AsyncStatusState } from '../store/useCardStore'
import type { WorkflowState } from './workflowAuthority'

export type TriStatus = 'ready' | 'needs_name' | 'invalid' | 'processing'

export const TRI_STATUS_LABEL: Record<TriStatus, string> = {
  ready: 'Ready',
  needs_name: 'Needs name',
  /** @deprecated Prefer needs_name in studio chrome; kept for export cluster compatibility. */
  invalid: 'Needs name',
  processing: 'Processing',
}

/** Workflow states shown in the context strip for power users (tooltip / sr-only). */
export const WORKFLOW_STATE_LABEL: Record<WorkflowState, string> = {
  BROWSING: 'Browsing',
  EDITING: 'Editing',
  PREVIEW_READY: 'Preview ready',
  EXPORT_READY: 'Export ready',
}

type CardSideAsyncSlice = Pick<
  Record<'scryfallFetch' | 'artUpload' | 'setIconUpload' | 'designLoad', AsyncStatusState>,
  'scryfallFetch' | 'artUpload' | 'setIconUpload' | 'designLoad'
>

/**
 * Context header: import / design load / asset uploads in flight, else card workflow readiness.
 * Export loading is surfaced on the download cluster only.
 * Never conflates with Saved/Unsaved.
 */
export function deriveContextTriStatus(
  workflowState: WorkflowState,
  asyncSlice: CardSideAsyncSlice,
): TriStatus {
  const busy =
    asyncSlice.scryfallFetch.status === 'loading' ||
    asyncSlice.artUpload.status === 'loading' ||
    asyncSlice.setIconUpload.status === 'loading' ||
    asyncSlice.designLoad.status === 'loading'
  if (busy) return 'processing'
  if (workflowState === 'BROWSING' || workflowState === 'EDITING') return 'needs_name'
  return 'ready'
}

/** Footer export control: PNG export pipeline vs export readiness. */
export function deriveExportTriStatus(
  workflowState: WorkflowState,
  exportAsync: AsyncStatusState,
): TriStatus {
  if (exportAsync.status === 'loading') return 'processing'
  if (workflowState !== 'EXPORT_READY') return 'needs_name'
  return 'ready'
}
