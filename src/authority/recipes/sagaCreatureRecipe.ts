/**
 * Standard / Saga Creature — Esper Terra–style hybrid seating.
 * Reminder strip under name; split chapters+art; type; full-width creature rules + P/T.
 * Ground truth: media/fidelity-class-saga/saga-creature-reference.png
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

export const SAGA_CREATURE_RECIPE: LayoutRecipe = {
  id: 'magic.standard.saga-creature',
  family: 'standard',
  variant: 'saga-creature',
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    /** Tall art on the right, under reminder strip → above type line. */
    art: { x: 0.5015, y: 0.198, w: 0.4218, h: 0.528 },
    name: { x: 0.0854, y: 0.0522, w: 0.8292, h: 0.0543 },
    mana: { x: 0.0, y: 0.0613, w: 0.9292, h: 71 / 2100, align: 'right' },
    type: { x: 0.0854, y: 0.736, w: 0.8292, h: 0.0543 },
    setSymbol: { x: 0.9227, y: 0.761, w: 0.12, h: 0.0381, anchor: 'right-center' },
    /** Full-width creature rules below type. */
    rules: { x: 0.0767, y: 0.802, w: 0.8476, h: 0.116 },
    ptFrame: { x: 0.7573, y: 0.8848, w: 0.188, h: 0.0733 },
    ptText: { x: 0.7928, y: 0.902, w: 0.1367, h: 0.0372 },
    collector: { x: 0.06, y: 0.94, w: 0.88, h: 0.05 },
  },
  typography: {
    name: { font: 'belerenb', size: 0.0381, oneLine: true, minSize: 0.022 },
    type: { font: 'belerenb', size: 0.028, oneLine: true, minSize: 0.018 },
    rules: { font: 'mplantin', size: 0.032, minSize: 0.018, lineHeight: 1.2, vAlign: 'top' },
    pt: { font: 'belerenbsc', size: 0.0372, align: 'center' },
  },
  mana: {
    pipSize: CC_PIP_SIZE_FRAC,
    pipSizePx: M15_REGULAR_MANA_PIP_SIZE_PX,
    pipGap: 0,
    shadowX: -0.001,
    shadowY: 0.0029,
  },
  extensions: {
    /** Full-width reminder strip under the name bar. */
    reminderStrip: { x: 0.0767, y: 0.1129, w: 0.8476, h: 0.078 },
    parchment: { x: 0.0767, y: 0.198, w: 0.421, h: 0.528 },
    banner: { x: 0.044, y: 0.215, w: 0.068, h: 0.492 },
    abilityCol: { x: 0.118, y: 0.215, w: 0.368, h: 0.498 },
    badge: { x: 0.0386, y: 0, w: 0.0787, h: 0.052 },
  },
  acceptancePxAt600: {
    nameTop: 4,
    artEdge: 6,
    typeTop: 4,
    rulesEdge: 6,
    ptCenter: 4,
    pipSize: 2,
  },
}
