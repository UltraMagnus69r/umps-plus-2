/**
 * Planeswalker Modern V2 only — bowed rules panel silhouette and pattern fills.
 * Isolated from frameBoxPath so shared frame geometry cannot regress other layouts.
 */

export function addPlaneswalkerModernV2RulesPanelPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bowDepth: number,
  reverse = false,
  bottomCornerR = 0,
) {
  const ww = Math.max(0, w)
  const hh = Math.max(0, h)
  if (ww <= 0 || hh <= 0) return

  const d = Math.max(0, bowDepth)
  const br = Math.max(0, Math.min(bottomCornerR, ww / 2, hh))
  const x0 = x
  const x1 = x + ww
  const bowSpan = Math.max(1e-4, ww - 2 * br)
  const bowLeft = x0 + br
  const bowRight = x1 - br

  if (!reverse) {
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
    ctx.lineTo(x1, y + hh - br)
    if (br > 0) {
      ctx.quadraticCurveTo(x1, y + hh, bowRight, y + hh)
    } else {
      ctx.lineTo(x1, y + hh)
    }
    ctx.bezierCurveTo(
      bowLeft + bowSpan * 0.67,
      y + hh + d,
      bowLeft + bowSpan * 0.33,
      y + hh + d,
      bowLeft,
      y + hh,
    )
    if (br > 0) {
      ctx.quadraticCurveTo(x0, y + hh, x0, y + hh - br)
    } else {
      ctx.lineTo(x0, y + hh)
    }
    ctx.lineTo(x0, y)
  } else {
    ctx.moveTo(bowLeft, y + hh)
    ctx.bezierCurveTo(
      bowLeft + bowSpan * 0.33,
      y + hh - d,
      bowLeft + bowSpan * 0.67,
      y + hh - d,
      bowRight,
      y + hh,
    )
    if (br > 0) {
      ctx.quadraticCurveTo(x1, y + hh, x1, y + hh - br)
    } else {
      ctx.lineTo(x1, y + hh)
    }
    ctx.lineTo(x1, y)
    ctx.lineTo(x0, y)
    if (br > 0) {
      ctx.lineTo(x0, y + hh - br)
      ctx.quadraticCurveTo(x0, y + hh, bowLeft, y + hh)
    } else {
      ctx.lineTo(x0, y + hh)
    }
  }
  ctx.closePath()
}

function bowedRulesPanelPatternHeight(panelH: number, bowDepth: number): number {
  return Math.max(1, Math.ceil(panelH + Math.max(0, bowDepth)))
}

export function createImagePatternForBowedRulesPanel(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  panelW: number,
  panelH: number,
  bowDepth: number,
): CanvasPattern | null {
  const w = Math.max(1, Math.ceil(panelW))
  const h = bowedRulesPanelPatternHeight(panelH, bowDepth)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const sctx = canvas.getContext('2d')
  if (!sctx) return null
  sctx.imageSmoothingEnabled = true
  sctx.drawImage(image, 0, 0, w, h)
  return ctx.createPattern(canvas, 'no-repeat')
}

export function createCoverImagePatternForBowedRulesPanel(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  panelW: number,
  panelH: number,
  bowDepth: number,
): CanvasPattern | null {
  const w = Math.max(1, Math.ceil(panelW))
  const h = bowedRulesPanelPatternHeight(panelH, bowDepth)
  const iw = image.naturalWidth || 1
  const ih = image.naturalHeight || 1
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  const dx = (w - dw) / 2
  const dy = (h - dh) / 2
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const sctx = canvas.getContext('2d')
  if (!sctx) return null
  sctx.imageSmoothingEnabled = true
  sctx.drawImage(image, dx, dy, dw, dh)
  return ctx.createPattern(canvas, 'no-repeat')
}

export function fillPlaneswalkerModernV2RulesPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bowDepth: number,
  fill: string | CanvasPattern,
  bottomCornerR = 0,
) {
  ctx.beginPath()
  addPlaneswalkerModernV2RulesPanelPath(ctx, x, y, w, h, bowDepth, false, bottomCornerR)
  ctx.fillStyle = fill
  ctx.fill()
}
