/**
 * Phase 16.1 — Status indicators (Ready / Invalid / Processing).
 * Maps existing workflow + async store signals only; no parallel business rules.
 */

import type { AsyncStatusState } from '../store/useCardStore'
import type { WorkflowState } from './workflowAuthority'

export type TriStatus = 'ready' | 'invalid' | 'processing'

export const TRI_STATUS_LABEL: Record<TriStatus, string> = {
  ready: 'Ready',
  invalid: 'Invalid',
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
 * Export loading is surfaced on the footer export cluster only.
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
  if (workflowState === 'BROWSING' || workflowState === 'EDITING') return 'invalid'
  return 'ready'
}

/** Footer export control: PNG export pipeline vs export readiness. */
export function deriveExportTriStatus(
  workflowState: WorkflowState,
  exportAsync: AsyncStatusState,
): TriStatus {
  if (exportAsync.status === 'loading') return 'processing'
  if (workflowState !== 'EXPORT_READY') return 'invalid'
  return 'ready'
}
