/**
 * Battle art / inner-border aperture path — shared by ArtLayer clip and
 * BattleChromeLayer punch so art fills the Modern inner-face rect under chrome.
 */
import {
  getBattleArtRect,
  getBattleInnerBorderCornerRadii,
  getBattleTrimCornerRadii,
} from '../../../authority/battleLayoutAuthority'

/**
 * Rounded rect with per-corner radii (TL, TR, BR, BL).
 * Optional `leftTangentExtra` kept for API compat (portrait default 0).
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
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
  ctx.lineTo(x, y + tl)
  ctx.quadraticCurveTo(x, y, x + tlH, y)
  ctx.closePath()
}

/** Outer trim silhouette (Standard Modern corner language). */
export function addBattleTrimPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  addBattleRoundRectPath(ctx, x, y, w, h, getBattleTrimCornerRadii(), 0)
}

/** Art aperture path in stage px (Modern inner + portrait-bottom extend). */
export function addBattleArtInnerClipPath(ctx: CanvasRenderingContext2D): void {
  const art = getBattleArtRect()
  addBattleArtInnerClipPathForRect(ctx, art.x, art.y, art.width, art.height)
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
  addBattleRoundRectPath(ctx, x, y, w, h, radii, 0)
}
