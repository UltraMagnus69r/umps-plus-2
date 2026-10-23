/**
 * Battle / Siege — landscape MotM stack (name → art → type → upright rules).
 * Regions mirror battleLayoutAuthority FACE (Invasion of Zendikar MOM #194 measure).
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

/** Zendikar-measured MotM stack — trim-norm of 2100×1500 (face-spec). */
const L_COLLECTOR = { x: 8 / 2100, y: 91 / 1500, w: 202 / 2100, h: 1319 / 1500 }
const L_TITLE = { x: 218 / 2100, y: 58 / 1500, w: 1823 / 2100, h: 141 / 1500 }
const L_MANA = { x: 1793 / 2100, y: 77 / 1500, w: 222 / 2100, h: 105 / 1500 }
const L_ART = { x: 218 / 2100, y: 58 / 1500, w: 1823 / 2100, h: 1383 / 1500 }
const L_TYPE = { x: 218 / 2100, y: 866 / 1500, w: 1823 / 2100, h: 135 / 1500 }
const L_SET = { x: 1934 / 2100, y: 882 / 1500, w: 91 / 2100, h: 101 / 1500 }
const L_RULES = { x: 218 / 2100, y: 1001 / 1500, w: 1823 / 2100, h: 441 / 1500 }
const L_DEFENSE = { x: 1894 / 2100, y: 1319 / 1500, w: 133 / 2100, h: 133 / 1500 }
const L_BACK_FACE_PT = { x: 1787 / 2100, y: 1313 / 1500, w: 105 / 2100, h: 48 / 1500 }
const L_TRANSFORM = { x: 218 / 2100, y: 58 / 1500, w: 141 / 2100, h: 141 / 1500 }
const L_HOLOGRAM = {
  x: 218 / 2100 - 68 / 2100 / 2,
  y: 58 / 1500 + 1383 / 1500 / 2 - 110 / 1500 / 2,
  w: 68 / 2100,
  h: 110 / 1500,
}

export const BATTLE_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.battle.regular',
  family: 'battle',
  variant: 'modern',
  /** Landscape trim; BattleChromeLayer owns upright stack seating. */
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: L_ART,
    name: L_TITLE,
    mana: { ...L_MANA, align: 'right' },
    type: L_TYPE,
    setSymbol: { ...L_SET, anchor: 'right-center' },
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
