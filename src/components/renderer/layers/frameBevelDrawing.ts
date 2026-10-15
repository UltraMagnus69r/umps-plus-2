import {
  BEVEL_INSET,
  reverseBezierPlatePathInLocalRect,
  type ReverseBezierPlateStageSpan,
} from '../../../authority/geometryAuthority'
import type { NameplateBoxShape } from '../../../authority/nameplateShapeAuthority'
import { addFrameBoxPlateContourPath, addFrameBoxBowedHorizontalPath, addFrameBoxBowedAllSidesPath, FRAME_BOX_OUTER_STROKE_PX, type PlateContourPathOptions } from './frameBoxPath'

export type BevelGradientColors = {
  raisedBevelLight: string
  raisedBevelDark: string
  recessedBevelLight: string
  recessedBevelDark: string
}

/**
 * Procedural 3D bevel for frame boxes. Optional `omitOuterStroke` for P/T body when pinline is drawn in a top overlay layer.
 */
export function drawBeveledFrameOnContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  r: number,
  innerFill: string | CanvasGradient | CanvasPattern,
  type: 'raised' | 'recessed',
  strokeColor: string,
  bevel: BevelGradientColors,
  opts?: {
    omitOuterStroke?: boolean
    outerStrokeWidthPx?: number
    shape?: NameplateBoxShape
    /** When shape is reverse Bezier, align straight runs to art/rules column in stage space. */
    reversePlateSpan?: ReverseBezierPlateStageSpan
    /** Landscape art window with convex top/bottom bowing; set bowVertical for left/right bows too. */
    bowedHorizontal?: { cornerR: number; bowDepth: number; bowVertical?: boolean }
    /** Fill interior only — no bevel ring or outer pinline (Modern V2 panel bodies). */
    fillOnly?: boolean
  },
) {
  const shape = opts?.shape ?? 'rounded'
  const bowedHorizontal = opts?.bowedHorizontal
  const fillOnly = opts?.fillOnly === true
  const x = 0
  const y = 0
  const topLeftColor = type === 'raised' ? bevel.raisedBevelLight : bevel.recessedBevelDark
  const bottomRightColor = type === 'raised' ? bevel.raisedBevelDark : bevel.recessedBevelLight
  const ri = Math.max(0, r - BEVEL_INSET)
  const outerStrokeWidthPx = Math.max(1, opts?.outerStrokeWidthPx ?? FRAME_BOX_OUTER_STROKE_PX)
  const ro = Math.max(0, r - outerStrokeWidthPx)

  const plateOptsFor = (localRectX: number, localRectW: number): PlateContourPathOptions | undefined => {
    if (shape !== 'reverseBezierPlate' || !opts?.reversePlateSpan) return undefined
    const { pathX, pathW } = reverseBezierPlatePathInLocalRect(opts.reversePlateSpan, localRectX, localRectW)
    return { reverseHorizontalSpan: { pathX, pathW } }
  }

  const addBowedContour = (
    localX: number,
    localY: number,
    localW: number,
    localH: number,
    radius: number,
    reverse = false,
  ) => {
    const addPath = bowedHorizontal?.bowVertical ? addFrameBoxBowedAllSidesPath : addFrameBoxBowedHorizontalPath
    addPath(ctx, localX, localY, localW, localH, Math.max(0, radius), bowedHorizontal!.bowDepth, reverse)
  }

  const addInnerContour = (localX: number, localY: number, localW: number, localH: number, radius: number, reverse = false) => {
    if (bowedHorizontal) {
      addBowedContour(localX, localY, localW, localH, Math.max(0, radius), reverse)
      return
    }
    addFrameBoxPlateContourPath(
      ctx,
      localX,
      localY,
      localW,
      localH,
      radius,
      shape,
      reverse,
      plateOptsFor(localX, localW),
    )
  }

  ctx.beginPath()
  addInnerContour(x + BEVEL_INSET, y + BEVEL_INSET, width - 2 * BEVEL_INSET, height - 2 * BEVEL_INSET, ri, false)
  ctx.fillStyle = innerFill
  ctx.fill()
  if (fillOnly) return
  ctx.beginPath()
  addInnerContour(
    x + outerStrokeWidthPx,
    y + outerStrokeWidthPx,
    width - 2 * outerStrokeWidthPx,
    height - 2 * outerStrokeWidthPx,
    ro,
    false,
  )
  addInnerContour(x + BEVEL_INSET, y + BEVEL_INSET, width - 2 * BEVEL_INSET, height - 2 * BEVEL_INSET, ri, true)
  const grad = ctx.createLinearGradient(x, y, x + width, y + height)
  grad.addColorStop(0, topLeftColor)
  grad.addColorStop(1, bottomRightColor)
  ctx.fillStyle = grad
  ctx.fill('evenodd')
  if (!opts?.omitOuterStroke) {
    ctx.beginPath()
    if (bowedHorizontal) {
      addBowedContour(x, y, width, height, r, false)
    } else {
      addFrameBoxPlateContourPath(ctx, x, y, width, height, r, shape, false, plateOptsFor(0, width))
    }
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = outerStrokeWidthPx
    ctx.stroke()
  }
}

/**
 * Raised circular frame: same fill + diagonal bevel ring + outer pinline as `drawBeveledFrameOnContext` on a square of side `diameter`.
 * Local origin: top-left of the bounding square; circle centered at (diameter/2, diameter/2).
 */
export function drawBeveledRaisedCircleOnContext(
  ctx: CanvasRenderingContext2D,
  diameter: number,
  strokeColor: string,
  bevel: BevelGradientColors,
  opts?: { omitOuterStroke?: boolean },
) {
  const w = diameter
  const h = diameter
  const cx = w / 2
  const cy = h / 2
  const R = diameter / 2
  const rInnerFill = Math.max(0, R - BEVEL_INSET)
  const rRingOuter = Math.max(0, R - FRAME_BOX_OUTER_STROKE_PX)
  const rRingInner = Math.max(0, R - BEVEL_INSET)

  const topLeftColor = bevel.raisedBevelLight
  const bottomRightColor = bevel.raisedBevelDark

  ctx.beginPath()
  ctx.arc(cx, cy, rInnerFill, 0, Math.PI * 2)
  ctx.fillStyle = '#f2f2f2'
  ctx.fill()

  if (rRingOuter > rRingInner && rRingOuter > 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, rRingOuter, 0, Math.PI * 2, false)
    ctx.arc(cx, cy, rRingInner, 0, Math.PI * 2, true)
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, topLeftColor)
    grad.addColorStop(1, bottomRightColor)
    ctx.fillStyle = grad
    ctx.fill('evenodd')
  }

  if (!opts?.omitOuterStroke && R > 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = FRAME_BOX_OUTER_STROKE_PX
    ctx.stroke()
  }
}
