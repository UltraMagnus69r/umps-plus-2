/**
 * Class seating matched to ground-truth ref (media/fidelity-class-saga/class-reference.png).
 * Same split as Saga: tall art RIGHT, parchment + level banner LEFT.
 * (CC packClass uses left-art; PipMint follows the Artificer/ref orientation.)
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

export const CLASS_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.class.regular',
  family: 'spell',
  variant: 'class',
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: { x: 0.5015, y: 0.1137, w: 0.4199, h: 0.7221 },
    name: { x: 0.0854, y: 0.0522, w: 0.8292, h: 0.0543 },
    mana: { x: 0.0, y: 0.0613, w: 0.9292, h: 71 / 2100, align: 'right' },
    type: { x: 0.0854, y: 0.8481, w: 0.8292, h: 0.0543 },
    setSymbol: { x: 0.9227, y: 0.8739, w: 0.12, h: 0.0381, anchor: 'right-center' },
    rules: { x: 0.11, y: 0.1137, w: 0.388, h: 0.7221 },
    ptText: { x: 0.7928, y: 0.902, w: 0.1367, h: 0.0372 },
    collector: { x: 0.06, y: 0.94, w: 0.88, h: 0.05 },
  },
  typography: {
    name: { font: 'belerenb', size: 0.0381, oneLine: true, minSize: 0.022 },
    type: { font: 'belerenb', size: 0.0324, oneLine: true, minSize: 0.02 },
    rules: { font: 'mplantin', size: 0.0305, minSize: 0.018, lineHeight: 1.2, vAlign: 'top' },
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
    banner: { x: 0.044, y: 0.1714, w: 0.068, h: 0.661 },
    reminder: { x: 0.0867, y: 0.1129, w: 0.404, h: 0.1772 },
    levelBand1: { x: 0.1334, y: 0.2896, w: 0.35, h: 0.1783 },
    levelBand2: { x: 0.1334, y: 0.4679, w: 0.35, h: 0.1783 },
    levelBand3: { x: 0.1334, y: 0.6462, w: 0.35, h: 0.1784 },
  },
  acceptancePxAt600: {
    nameTop: 4,
    artEdge: 6,
    typeTop: 4,
    rulesEdge: 6,
    pipSize: 2,
  },
}
