/**
 * Battle art / inner-border aperture path — shared by ArtLayer clip and
 * BattleChromeLayer punch so the art window matches the inner-border shape.
 */
import {
  getBattleInnerBorderCornerRadii,
  getBattleInnerBorderRect,
  getBattleLeftCornerHorizontalRadius,
} from '../../../authority/battleLayoutAuthority'

/**
 * Rounded rect with per-corner radii (TL, TR, BR, BL).
 * Left corners keep vertical anchors at `tl`/`bl` but push the top/bottom
 * tangent points further right by `leftTangentExtra` so the arc starts later.
 */
export function addBattleRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: readonly [number, number, number, number],
  leftTangentExtra = 0,
): void {
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, Math.min(w, h) / 2))) as [
    number,
    number,
    number,
    number,
  ]
  const tlH = Math.min(w / 2, tl + Math.max(0, leftTangentExtra))
  const blH = Math.min(w / 2, bl + Math.max(0, leftTangentExtra))
  ctx.moveTo(x + tlH, y)
  ctx.lineTo(x + w - tr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
  ctx.lineTo(x + blH, y + h)
  // BL: vertical anchor at y+h-bl stays; bottom tangent at x+blH
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
  ctx.lineTo(x, y + tl)
  // TL: vertical anchor at y+tl stays; top tangent at x+tlH
  ctx.quadraticCurveTo(x, y, x + tlH, y)
  ctx.closePath()
}

/** Inner-border / art aperture path in stage px (bounds + corner radii). */
export function addBattleArtInnerClipPath(ctx: CanvasRenderingContext2D): void {
  const border = getBattleInnerBorderRect()
  addBattleArtInnerClipPathForRect(ctx, border.x, border.y, border.width, border.height)
}

/** Same path with explicit bounds (chrome punch / tests). */
export function addBattleArtInnerClipPathForRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const radii = getBattleInnerBorderCornerRadii()
  const leftTangentExtra = getBattleLeftCornerHorizontalRadius() - radii[0]
  addBattleRoundRectPath(ctx, x, y, w, h, radii, leftTangentExtra)
}
