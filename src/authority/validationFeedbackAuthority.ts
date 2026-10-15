/**
 * Phase 16.2 — Validation feedback copy + hint resolution.
 * Uses `analyzeWorkflowDerivation` only; no extra validation rules.
 */

import { analyzeWorkflowDerivation, type WorkflowDerivationInput } from './workflowAuthority'

export const UI_VALIDATION_INLINE = 'ui-validation-inline'

export type WorkflowValidationHints = {
  /** Default template — one summary in Core Inputs (avoids duplicate name/type lines). */
  coreBrowsingHint?: string
  nameUnderField?: string
  typeLineUnderField?: string
  /** Land full-art reduced core hides the type line control but workflow still requires it. */
  typeLineCorePanel?: string
  /** Hidden layout: preview OK but clone image missing blocks export. */
  cloneExportHint?: string
}

const COPY = {
  browsing:
    'This is still the default card template. Add a card name and type line (for example via import) to enable preview.',
  name: 'Card name is required before preview.',
  typeLine: 'Type line is required before preview.',
  typeLineLand:
    'Type line is still required for preview. Import a print or use a layout that exposes the type line field.',
  clone: 'Hidden layout needs a full-card overlay before export. Use From Scryfall or From image URL above.',
} as const

export function resolveWorkflowValidationHints(
  input: WorkflowDerivationInput,
  options: { landFullArtReducedCore: boolean },
): WorkflowValidationHints {
  const a = analyzeWorkflowDerivation(input)
  const hints: WorkflowValidationHints = {}
  if (a.isBrowsingBaseline) {
    hints.coreBrowsingHint = COPY.browsing
    return hints
  }
  if (!a.nameOk) hints.nameUnderField = COPY.name
  if (!a.typeOk) {
    if (options.landFullArtReducedCore) hints.typeLineCorePanel = COPY.typeLineLand
    else hints.typeLineUnderField = COPY.typeLine
  }
  if (a.previewReady && a.cloneLayoutBlocksExport) {
    hints.cloneExportHint = COPY.clone
  }
  return hints
}
