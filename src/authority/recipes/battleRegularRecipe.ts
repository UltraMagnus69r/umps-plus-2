/**
 * Card Conjurer Battle / Siege seating (packBattle) — landscape 2100×1500 face
 * mapped into PipMint portrait trim 1500×2100 via 90° CW:
 *   x_p = 1 - y_l - h_l,  y_p = x_l,  w_p = h_l,  h_p = w_l
 * (CC norms: x/w of 2100, y/h of 1500.)
 */
import type { LayoutRecipe, TrimNormRect } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

/** Landscape rect (CC Battle face) → portrait trim-norm. */
function landscapeToPortrait(r: TrimNormRect): TrimNormRect {
  return {
    x: 1 - r.y - r.h,
    y: r.x,
    w: r.h,
    h: r.w,
  }
}

/** CC Battle landscape fractions (x/w ÷2100, y/h ÷1500). */
const L_ART = { x: 167 / 2100, y: 60 / 1500, w: 1873 / 2100, h: 1371 / 1500 }
const L_TITLE = { x: 387 / 2100, y: 81 / 1500, w: 1547 / 2100, h: 114 / 1500 }
const L_MANA = { x: 0 / 2100, y: 100 / 1500, w: 1957 / 2100, h: 71 / 1500 }
const L_TYPE = { x: 268 / 2100, y: 873 / 1500, w: 1667 / 2100, h: 114 / 1500 }
const L_RULES = { x: 272 / 2100, y: 1008 / 1500, w: 1661 / 2100, h: 414 / 1500 }
const L_DEFENSE = { x: 1920 / 2100, y: 1320 / 1500, w: 86 / 2100, h: 123 / 1500 }
const L_SET = { x: 1945 / 2100, y: 925 / 1500, w: 180 / 2100, h: 86 / 1500 }

export const BATTLE_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.battle.regular',
  family: 'battle',
  variant: 'modern',
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: landscapeToPortrait(L_ART),
    name: landscapeToPortrait(L_TITLE),
    mana: { ...landscapeToPortrait(L_MANA), align: 'right' },
    type: landscapeToPortrait(L_TYPE),
    setSymbol: { ...landscapeToPortrait(L_SET), anchor: 'right-center' },
    rules: landscapeToPortrait(L_RULES),
    /** Defense badge (siege toughness) — mapped from landscape defense slot */
    ptText: landscapeToPortrait(L_DEFENSE),
    collector: { x: 0.06, y: 0.94, w: 0.88, h: 0.05 },
  },
  typography: {
    name: { font: 'belerenb', size: (0.0381 * 2100) / 1500, oneLine: true, minSize: 0.022 },
    type: { font: 'belerenb', size: (0.0324 * 2100) / 1500, oneLine: true, minSize: 0.02 },
    rules: { font: 'mplantin', size: (0.0362 * 2100) / 1500, minSize: 0.018, lineHeight: 1.2, vAlign: 'top' },
    pt: { font: 'belerenbsc', size: (0.0372 * 2100) / 1500, align: 'center' },
  },
  mana: {
    pipSize: CC_PIP_SIZE_FRAC,
    pipSizePx: M15_REGULAR_MANA_PIP_SIZE_PX,
    pipGap: 0,
    shadowX: -0.001,
    shadowY: 0.0029,
  },
  extensions: {
    defense: landscapeToPortrait(L_DEFENSE),
  },
  acceptancePxAt600: {
    nameTop: 6,
    artEdge: 8,
    typeTop: 6,
    rulesEdge: 8,
    pipSize: 2,
  },
}
