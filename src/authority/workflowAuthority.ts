/**
 * Phase 10.1 — Workflow State Authority.
 * Canonical finite workflow model; derivation rules live here (store applies them).
 */

export type WorkflowState =
  | 'BROWSING'
  | 'EDITING'
  | 'PREVIEW_READY'
  | 'EXPORT_READY'

export type StageExporterFn = () => Promise<HTMLCanvasElement>

/**
 * Inputs are plain values so this module stays free of Zustand / CardData imports
 * (avoids circular dependencies with the store).
 */
export type WorkflowDerivationInput = {
  /** Card matches default template (theme preserved) and no Module 4.1 dirty flags. */
  isBrowsingBaseline: boolean
  name: string
  typeLine: string
  fontsLoaded: boolean
  stageExporter: StageExporterFn | null
  /** Legacy layout mode; `'Hidden'` is the clone-card workflow. */
  currentLayout: string
  clonedCardImage: string
}

/** Shared breakdown for workflow + Phase 16.2 validation copy (same predicates as deriveWorkflowState). */
export type WorkflowDerivationAnalysis = {
  isBrowsingBaseline: boolean
  nameOk: boolean
  typeOk: boolean
  previewReady: boolean
  cloneLayoutBlocksExport: boolean
}

export function analyzeWorkflowDerivation(input: WorkflowDerivationInput): WorkflowDerivationAnalysis {
  if (input.isBrowsingBaseline) {
    return {
      isBrowsingBaseline: true,
      nameOk: false,
      typeOk: false,
      previewReady: false,
      cloneLayoutBlocksExport: false,
    }
  }
  const nameOk = String(input.name ?? '').trim().length > 0
  const typeOk = String(input.typeLine ?? '').trim().length > 0
  const previewReady = nameOk && typeOk && input.fontsLoaded
  const cloneLayoutBlocksExport =
    input.currentLayout === 'Hidden' && String(input.clonedCardImage ?? '').trim().length === 0
  return {
    isBrowsingBaseline: false,
    nameOk,
    typeOk,
    previewReady,
    cloneLayoutBlocksExport,
  }
}

/**
 * Deterministic priority (first match wins):
 * 1. BROWSING — empty/default session
 * 2. EDITING — not browsing but preview requirements not met
 * 3. EXPORT_READY — preview-ready + export pipeline attached + clone layout satisfied when applicable
 * 4. PREVIEW_READY — otherwise
 */
export function deriveWorkflowState(input: WorkflowDerivationInput): WorkflowState {
  if (input.isBrowsingBaseline) return 'BROWSING'
  const a = analyzeWorkflowDerivation(input)
  if (!a.previewReady) return 'EDITING'
  if (input.stageExporter != null && !a.cloneLayoutBlocksExport) return 'EXPORT_READY'
  return 'PREVIEW_READY'
}
