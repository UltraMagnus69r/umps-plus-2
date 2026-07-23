/**
 * Art Placement Authority (Phase 6.1)
 * Deterministic, layout-aware default placement and clamp math.
 */
export type ArtBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type ArtPlacementInput = {
  imageWidth: number
  imageHeight: number
  bounds: ArtBounds
  minZoom?: number
  maxZoom?: number
}

export type ArtPlacementState = {
  artZoom: number
  artOffsetX: number
  artOffsetY: number
}

function safePositive(n: number, fallback = 1): number {
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/**
 * Returns a zoom multiplier relative to width-fit scale (`bounds.width / imageWidth`)
 * that guarantees cover behavior for the target bounds.
 */
export function getCoverZoomMultiplier(input: ArtPlacementInput): number {
  const iw = safePositive(input.imageWidth)
  const ih = safePositive(input.imageHeight)
  const bw = safePositive(input.bounds.width)
  const bh = safePositive(input.bounds.height)
  const widthScale = bw / iw
  const heightScale = bh / ih
  const coverScale = Math.max(widthScale, heightScale)
  const zoom = coverScale / widthScale
  const minZoom = safePositive(input.minZoom ?? 1)
  const maxZoom = safePositive(input.maxZoom ?? 4)
  return clamp(zoom, minZoom, maxZoom)
}

/**
 * Deterministic default placement for a new image/layout:
 * - cover fit
 * - centered crop
 */
export function computeDefaultArtPlacement(input: ArtPlacementInput): ArtPlacementState {
  const artZoom = getCoverZoomMultiplier(input)
  return {
    artZoom,
    artOffsetX: 0,
    artOffsetY: 0,
  }
}

/**
 * Clamp offsets so the rendered image fully covers the target bounds.
 */
export function clampArtPlacementOffsets(
  input: ArtPlacementInput & { artZoom: number; artOffsetX: number; artOffsetY: number },
): { artOffsetX: number; artOffsetY: number } {
  const iw = safePositive(input.imageWidth)
  const ih = safePositive(input.imageHeight)
  const bw = safePositive(input.bounds.width)
  const bh = safePositive(input.bounds.height)
  const bx = input.bounds.x
  const by = input.bounds.y
  const zoom = clamp(safePositive(input.artZoom), safePositive(input.minZoom ?? 1), safePositive(input.maxZoom ?? 4))

  const baseScale = bw / iw
  const scale = baseScale * zoom
  const dispW = iw * scale
  const dispH = ih * scale

  const cx = bx + bw / 2
  const cy = by + bh / 2
  const curX = cx + input.artOffsetX - dispW / 2
  const curY = cy + input.artOffsetY - dispH / 2

  const minX = bx + Math.min(0, bw - dispW)
  const maxX = bx
  const minY = by + Math.min(0, bh - dispH)
  const maxY = by

  const clampedX = clamp(curX, minX, maxX)
  const clampedY = clamp(curY, minY, maxY)

  return {
    artOffsetX: clampedX - cx + dispW / 2,
    artOffsetY: clampedY - cy + dispH / 2,
  }
}
