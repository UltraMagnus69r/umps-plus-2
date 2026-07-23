import type { NameplateBoxShape } from '../../../authority/nameplateShapeAuthority'
import {
  PLATE_BEZIER_DEPTH_RATIO,
  PLATE_BEZIER_HANDLE_INSET_X,
  PLATE_BEZIER_HANDLE_INSET_Y,
  REVERSE_PLATE_DEPTH_MULTIPLIER,
} from '../../../authority/plateBezierContourAuthority'

/** Matches FrameLayer `BEVEL_OUTER_STROKE` — outer pinline width. */
export const FRAME_BOX_OUTER_STROKE_PX = 2

export function addFrameBoxRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  reverse = false,
) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))
  if (rad <= 0) {
    if (reverse) {
      ctx.moveTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.lineTo(x, y)
      ctx.lineTo(x + w, y)
    } else {
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
    }
    ctx.closePath()
    return
  }
  if (reverse) {
    ctx.moveTo(x + w, y + h - rad)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    ctx.lineTo(x + rad, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
    ctx.lineTo(x + w - rad, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
  } else {
    ctx.moveTo(x + rad, y)
    ctx.lineTo(x + w - rad, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
    ctx.lineTo(x + w, y + h - rad)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    ctx.lineTo(x + rad, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
  }
  ctx.closePath()
}

export type FrameBoxCornerRadii = {
  topLeft: number
  topRight: number
  bottomLeft: number
  bottomRight: number
}

/** Rounded rectangle with independent corner radii (stage px). */
export function addFrameBoxRoundedRectVariablePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: FrameBoxCornerRadii,
  reverse = false,
) {
  const ww = Math.max(0, w)
  const hh = Math.max(0, h)
  if (ww <= 0 || hh <= 0) return

  const tl = Math.max(0, Math.min(radii.topLeft, ww / 2, hh / 2))
  const tr = Math.max(0, Math.min(radii.topRight, ww / 2, hh / 2))
  const br = Math.max(0, Math.min(radii.bottomRight, ww / 2, hh / 2))
  const bl = Math.max(0, Math.min(radii.bottomLeft, ww / 2, hh / 2))

  if (!reverse) {
    ctx.moveTo(x + tl, y)
    ctx.lineTo(x + ww - tr, y)
    if (tr > 0) ctx.quadraticCurveTo(x + ww, y, x + ww, y + tr)
    else ctx.lineTo(x + ww, y)
    ctx.lineTo(x + ww, y + hh - br)
    if (br > 0) ctx.quadraticCurveTo(x + ww, y + hh, x + ww - br, y + hh)
    else ctx.lineTo(x + ww, y + hh)
    ctx.lineTo(x + bl, y + hh)
    if (bl > 0) ctx.quadraticCurveTo(x, y + hh, x, y + hh - bl)
    else ctx.lineTo(x, y + hh)
    ctx.lineTo(x, y + tl)
    if (tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y)
    else ctx.lineTo(x, y)
  } else {
    ctx.moveTo(x + ww - br, y + hh)
    ctx.lineTo(x + bl, y + hh)
    if (bl > 0) ctx.quadraticCurveTo(x, y + hh, x, y + hh - bl)
    else ctx.lineTo(x, y + hh)
    ctx.lineTo(x, y + tl)
    if (tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y)
    else ctx.lineTo(x, y)
    ctx.lineTo(x + ww - tr, y)
    if (tr > 0) ctx.quadraticCurveTo(x + ww, y, x + ww, y + tr)
    else ctx.lineTo(x + ww, y)
    ctx.lineTo(x + ww, y + hh - br)
    if (br > 0) ctx.quadraticCurveTo(x + ww, y + hh, x + ww - br, y + hh)
    else ctx.lineTo(x + ww, y + hh)
  }
  ctx.closePath()
}

/**
 * Single closed cubic-Bezier silhouette: full-width top/bottom runs, shallow side scallops
 * (stamped plate). Tuning: `plateBezierContourAuthority`.
 */
export function addFrameBoxBezierPlatePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  reverse = false,
) {
  const ww = Math.max(0, w)
  const hh = Math.max(0, h)
  if (ww <= 0 || hh <= 0) return

  const m = Math.min(ww, hh)
  const d = Math.max(0, Math.min(m * PLATE_BEZIER_DEPTH_RATIO, m * 0.48))

  if (ww >= hh) {
    const aRaw = hh * PLATE_BEZIER_HANDLE_INSET_Y
    const a = Math.max(1e-4, Math.min(aRaw, hh * 0.5 - 1e-4))
    if (!reverse) {
      ctx.moveTo(x, y)
      ctx.lineTo(x + ww, y)
      ctx.bezierCurveTo(x + ww - d, y + a, x + ww - d, y + hh - a, x + ww, y + hh)
      ctx.lineTo(x, y + hh)
      ctx.bezierCurveTo(x + d, y + hh - a, x + d, y + a, x, y)
    } else {
      ctx.moveTo(x + ww, y)
      ctx.lineTo(x, y)
      ctx.bezierCurveTo(x + d, y + a, x + d, y + hh - a, x, y + hh)
      ctx.lineTo(x + ww, y + hh)
      ctx.bezierCurveTo(x + ww - d, y + hh - a, x + ww - d, y + a, x + ww, y)
    }
  } else {
    const bRaw = ww * PLATE_BEZIER_HANDLE_INSET_X
    const b = Math.max(1e-4, Math.min(bRaw, ww * 0.5 - 1e-4))
    if (!reverse) {
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + hh)
      ctx.bezierCurveTo(x + b, y + hh - d, x + ww - b, y + hh - d, x + ww, y + hh)
      ctx.lineTo(x + ww, y)
      ctx.bezierCurveTo(x + ww - b, y + d, x + b, y + d, x, y)
    } else {
      ctx.moveTo(x, y + hh)
      ctx.lineTo(x, y)
      ctx.bezierCurveTo(x + b, y + d, x + ww - b, y + d, x + ww, y)
      ctx.lineTo(x + ww, y + hh)
      ctx.bezierCurveTo(x + ww - b, y + hh - d, x + b, y + hh - d, x, y + hh)
    }
  }
  ctx.closePath()
}

/**
 * Same topology as `addFrameBoxBezierPlatePath` but side curves bulge **outward** (convex)
 * instead of pinching inward — opposite Bezier control direction on left/right (or top/bottom when vertical).
 */
export type ReverseBezierHorizontalSpan = { pathX: number; pathW: number }

export function addFrameBoxReverseBezierPlatePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  reverse = false,
  horizontalSpan?: ReverseBezierHorizontalSpan,
) {
  let x0 = x
  let ww = Math.max(0, w)
  const hh = Math.max(0, h)
  if (horizontalSpan && w >= h) {
    x0 = x + horizontalSpan.pathX
    ww = Math.max(0, horizontalSpan.pathW)
  }
  if (ww <= 0 || hh <= 0) return

  const m = Math.min(ww, hh)
  const depthRatio = PLATE_BEZIER_DEPTH_RATIO * REVERSE_PLATE_DEPTH_MULTIPLIER
  const d = Math.max(0, Math.min(m * depthRatio, m * 0.48))

  if (ww >= hh) {
    const aRaw = hh * PLATE_BEZIER_HANDLE_INSET_Y
    const a = Math.max(1e-4, Math.min(aRaw, hh * 0.5 - 1e-4))
    const x = x0
    if (!reverse) {
      ctx.moveTo(x, y)
      ctx.lineTo(x + ww, y)
      ctx.bezierCurveTo(x + ww + d, y + a, x + ww + d, y + hh - a, x + ww, y + hh)
      ctx.lineTo(x, y + hh)
      ctx.bezierCurveTo(x - d, y + hh - a, x - d, y + a, x, y)
    } else {
      ctx.moveTo(x + ww, y)
      ctx.lineTo(x, y)
      ctx.bezierCurveTo(x - d, y + a, x - d, y + hh - a, x, y + hh)
      ctx.lineTo(x + ww, y + hh)
      ctx.bezierCurveTo(x + ww + d, y + hh - a, x + ww + d, y + a, x + ww, y)
    }
  } else {
    const bRaw = ww * PLATE_BEZIER_HANDLE_INSET_X
    const b = Math.max(1e-4, Math.min(bRaw, ww * 0.5 - 1e-4))
    if (!reverse) {
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + hh)
      ctx.bezierCurveTo(x + b, y + hh + d, x + ww - b, y + hh + d, x + ww, y + hh)
      ctx.lineTo(x + ww, y)
      ctx.bezierCurveTo(x + ww - b, y - d, x + b, y - d, x, y)
    } else {
      ctx.moveTo(x, y + hh)
      ctx.lineTo(x, y)
      ctx.bezierCurveTo(x + b, y - d, x + ww - b, y - d, x + ww, y)
      ctx.lineTo(x + ww, y + hh)
      ctx.bezierCurveTo(x + ww - b, y + hh + d, x + b, y + hh + d, x, y + hh)
    }
  }
  ctx.closePath()
}

/**
 * Landscape frame with rounded corners; top/bottom and left/right edges bow outward (convex).
 * Used for Planeswalker / Modern V2 art window when side bows are enabled.
 */
export function addFrameBoxBowedAllSidesPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cornerR: number,
  bowDepth: number,
  reverse = false,
) {
  const ww = Math.max(0, w)
  const hh = Math.max(0, h)
  if (ww <= 0 || hh <= 0) return

  const rad = Math.max(0, Math.min(cornerR, ww / 2, hh / 2))
  const d = Math.max(0, bowDepth)
  const topLen = Math.max(1e-4, ww - 2 * rad)
  const sideLen = Math.max(1e-4, hh - 2 * rad)
  const x0 = x + rad
  const x1 = x + ww - rad
  const y0 = y + rad
  const y1 = y + hh - rad

  if (!reverse) {
    ctx.moveTo(x0, y)
    ctx.bezierCurveTo(x0 + topLen * 0.33, y - d, x0 + topLen * 0.67, y - d, x1, y)
    ctx.quadraticCurveTo(x + ww, y, x + ww, y0)
    ctx.bezierCurveTo(x + ww + d, y0 + sideLen * 0.33, x + ww + d, y0 + sideLen * 0.67, x + ww, y1)
    ctx.quadraticCurveTo(x + ww, y + hh, x1, y + hh)
    ctx.bezierCurveTo(x0 + topLen * 0.67, y + hh + d, x0 + topLen * 0.33, y + hh + d, x0, y + hh)
    ctx.quadraticCurveTo(x, y + hh, x, y1)
    ctx.bezierCurveTo(x - d, y0 + sideLen * 0.67, x - d, y0 + sideLen * 0.33, x, y0)
    ctx.quadraticCurveTo(x, y, x0, y)
  } else {
    ctx.moveTo(x1, y)
    ctx.bezierCurveTo(x0 + topLen * 0.67, y + d, x0 + topLen * 0.33, y + d, x0, y)
    ctx.quadraticCurveTo(x, y, x, y0)
    ctx.bezierCurveTo(x - d, y0 + sideLen * 0.33, x - d, y0 + sideLen * 0.67, x, y1)
    ctx.quadraticCurveTo(x, y + hh, x0, y + hh)
    ctx.bezierCurveTo(x0 + topLen * 0.33, y + hh - d, x0 + topLen * 0.67, y + hh - d, x1, y + hh)
    ctx.quadraticCurveTo(x + ww, y + hh, x + ww, y1)
    ctx.bezierCurveTo(x + ww - d, y0 + sideLen * 0.67, x + ww - d, y0 + sideLen * 0.33, x + ww, y0)
    ctx.quadraticCurveTo(x + ww, y, x1, y)
  }
  ctx.closePath()
}

/**
 * Landscape frame with rounded corners and top/bottom edges bowed outward (convex).
 * Used for Planeswalker / Modern V2 art window.
 */
export function addFrameBoxBowedHorizontalPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cornerR: number,
  bowDepth: number,
  reverse = false,
) {
  const ww = Math.max(0, w)
  const hh = Math.max(0, h)
  if (ww <= 0 || hh <= 0) return

  const rad = Math.max(0, Math.min(cornerR, ww / 2, hh / 2))
  const d = Math.max(0, bowDepth)
  const span = Math.max(1e-4, ww - 2 * rad)
  const a = Math.max(1e-4, Math.min(span * 0.22, span * 0.5 - 1e-4))
  const mid = x + ww / 2

  if (!reverse) {
    ctx.moveTo(x + rad, y)
    ctx.lineTo(x + rad + a, y)
    ctx.bezierCurveTo(mid - d, y - d, mid + d, y - d, x + ww - rad - a, y)
    ctx.lineTo(x + ww - rad, y)
    ctx.quadraticCurveTo(x + ww, y, x + ww, y + rad)
    ctx.lineTo(x + ww, y + hh - rad)
    ctx.quadraticCurveTo(x + ww, y + hh, x + ww - rad, y + hh)
    ctx.lineTo(x + ww - rad - a, y + hh)
    ctx.bezierCurveTo(mid + d, y + hh + d, mid - d, y + hh + d, x + rad + a, y + hh)
    ctx.lineTo(x + rad, y + hh)
    ctx.quadraticCurveTo(x, y + hh, x, y + hh - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
  } else {
    ctx.moveTo(x + ww - rad, y)
    ctx.lineTo(x + ww - rad - a, y)
    ctx.bezierCurveTo(mid + d, y + d, mid - d, y + d, x + rad + a, y)
    ctx.lineTo(x + rad, y)
    ctx.quadraticCurveTo(x, y, x, y + rad)
    ctx.lineTo(x, y + hh - rad)
    ctx.quadraticCurveTo(x, y + hh, x + rad, y + hh)
    ctx.lineTo(x + rad + a, y + hh)
    ctx.bezierCurveTo(mid - d, y + hh - d, mid + d, y + hh - d, x + ww - rad - a, y + hh)
    ctx.lineTo(x + ww - rad, y + hh)
    ctx.quadraticCurveTo(x + ww, y + hh, x + ww, y + hh - rad)
    ctx.lineTo(x + ww, y + rad)
    ctx.quadraticCurveTo(x + ww, y, x + ww - rad, y)
  }
  ctx.closePath()
}

export type PlateContourPathOptions = {
  reverseHorizontalSpan?: ReverseBezierHorizontalSpan
}

/** Unified routing for name/type/P/T plates — one path per mode (legacy rounded vs Bezier plate). */
export function addFrameBoxPlateContourPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  shape: NameplateBoxShape,
  reverse = false,
  plateOpts?: PlateContourPathOptions,
) {
  if (shape === 'bezierPlate') {
    addFrameBoxBezierPlatePath(ctx, x, y, w, h, reverse)
  } else if (shape === 'reverseBezierPlate') {
    addFrameBoxReverseBezierPlatePath(ctx, x, y, w, h, reverse, plateOpts?.reverseHorizontalSpan)
  } else {
    addFrameBoxRoundedRectPath(ctx, x, y, w, h, r, reverse)
  }
}
