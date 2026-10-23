/**
 * Battle / Siege — portrait side-column (name L / near-full art / type / rules R / collector).
 * Regions mirror battleLayoutAuthority FACE; art region = Modern inner-face (cover under chrome).
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

/**
 * Exact Modern inner-border on Standard trim (stage ≈ 128,122,1394,1840).
 * Art cover-fills; chrome plates overlay.
 */
const L_ART = { x: 53 / 1500, y: 47 / 2100, w: 1394 / 1500, h: 1840 / 2100 }
/** Side-column — trim-norm of 1500×2100 (remeasure → portrait). */
const L_COLLECTOR = { x: 58 / 1500, y: 1932 / 2100, w: 1384 / 1500, h: 166 / 2100 }
const L_TITLE = { x: 58 / 1500, y: 58 / 2100, w: 141 / 1500, h: 1873 / 2100 }
const L_MANA = { x: 71 / 1500, y: 80 / 2100, w: 116 / 1500, h: 160 / 2100 }
const L_TYPE = { x: 857 / 1500, y: 58 / 2100, w: 145 / 1500, h: 1873 / 2100 }
const L_SET = { x: 893 / 1500, y: 76 / 2100, w: 94 / 1500, h: 94 / 2100 }
const L_RULES = { x: 1002 / 1500, y: 58 / 2100, w: 442 / 1500, h: 1873 / 2100 }
const L_DEFENSE = { x: 1320 / 1500, y: 70 / 2100, w: 120 / 1500, h: 120 / 2100 }
const L_BACK_FACE_PT = { x: 1220 / 1500, y: 78 / 2100, w: 90 / 1500, h: 110 / 2100 }
const L_TRANSFORM = { x: 80 / 1500, y: 1835 / 2100, w: 96 / 1500, h: 96 / 2100 }
const L_HOLOGRAM = {
  x: 201 / 1500 - 68 / 1500 / 2,
  y: 58 / 2100 + 1873 / 2100 / 2 - 110 / 2100 / 2,
  w: 68 / 1500,
  h: 110 / 2100,
}

export const BATTLE_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.battle.regular',
  family: 'battle',
  variant: 'modern',
  /** Portrait trim; BattleChromeLayer owns side-column seating. */
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: L_ART,
    name: L_TITLE,
    mana: { ...L_MANA, align: 'center' },
    type: L_TYPE,
    setSymbol: { ...L_SET, anchor: 'center' },
    rules: L_RULES,
    ptText: L_DEFENSE,
    collector: L_COLLECTOR,
  },
  typography: {
    name: { font: 'belerenb', size: 0.0381, oneLine: true, minSize: 0.022 },
    type: { font: 'belerenb', size: 0.0324, oneLine: true, minSize: 0.02 },
    rules: { font: 'mplantin', size: 0.0362, minSize: 0.018, lineHeight: 1.2, vAlign: 'top' },
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
    defense: L_DEFENSE,
    backFacePT: L_BACK_FACE_PT,
    collectorStrip: L_COLLECTOR,
    hologram: L_HOLOGRAM,
    transform: L_TRANSFORM,
  },
  acceptancePxAt600: {
    nameTop: 6,
    artEdge: 8,
    typeTop: 6,
    rulesEdge: 8,
    pipSize: 2,
  },
}
