import { TAROT_GEOMETRY } from './tarotLayoutAuthority'

/** Arched art silhouette clip — vertical sides + upper ellipse. */
export function clipTarotArt(ctx: CanvasRenderingContext2D) {
  const { left, right, bottom, springY, cx, cy, rx, ry } = TAROT_GEOMETRY.artClip
  ctx.beginPath()
  ctx.moveTo(left, bottom)
  ctx.lineTo(left, springY)
  // Upper arch: left spring → apex → right spring
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2, false)
  ctx.lineTo(right, bottom)
  ctx.closePath()
}

export function addTarotArtClipPath(ctx: CanvasRenderingContext2D) {
  clipTarotArt(ctx)
}
