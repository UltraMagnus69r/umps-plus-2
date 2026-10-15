import { BEVEL_INSET, getStandardLayoutGeometry } from './geometryAuthority'

/** Standard / Land Pre-Modern — fixed rules text box outer frame height (stage px @ 600 DPI). */
export const PRE_MODERN_TEXT_BOX_OUTER_Y = 1396
/** 20% shorter than the original 715 px; top edge stays at {@link PRE_MODERN_TEXT_BOX_OUTER_Y}. */
export const PRE_MODERN_TEXT_BOX_OUTER_H = 572

export type PreModernTextBoxStageRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Outer recessed frame — x/width match the pre-modern art box outer frame. */
export function getPreModernTextBoxOuterRect(): PreModernTextBoxStageRect {
  const { artX, artW } = getStandardLayoutGeometry()
  return {
    x: artX,
    y: PRE_MODERN_TEXT_BOX_OUTER_Y,
    width: artW,
    height: PRE_MODERN_TEXT_BOX_OUTER_H,
  }
}

/** Inset rules / fill region inside the recessed frame (matches art-box inner inset). */
export function getPreModernTextBoxInnerRect(): PreModernTextBoxStageRect {
  const outer = getPreModernTextBoxOuterRect()
  return {
    x: outer.x + BEVEL_INSET,
    y: outer.y + BEVEL_INSET,
    width: outer.width - 2 * BEVEL_INSET,
    height: outer.height - 2 * BEVEL_INSET,
  }
}
