/**
 * Modern nameplate crown placement.
 * Crown PNGs sit behind the raised name plate (Showcase-style) and over art.
 *
 * Assets are authored so a transparent nameplate slot (~9.7:1) maps onto the
 * drawn nameplate outer (art-aligned when applicable). Placement scales X/Y
 * independently so the hole matches the plate in both axes.
 */

import { BEVEL_INSET, getStandardLayoutGeometry, type CardLayoutMode } from './geometryAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from './layoutRegistry'
import type { LayoutId } from './layoutTaxonomy'
import { buildModernDummyStageRects } from './modernDummyLayoutAuthority'
import {
  type NameplateBoxShape,
  resolveEffectiveNameplateShape,
} from './nameplateShapeAuthority'
import { resolveArtAlignedPlateOuterRect } from './plateArtAlignmentAuthority'
import {
  getPlaneswalkerModernV2ArtOuterRect,
  PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER,
} from './planeswalkerModernV2LayoutAuthority'
import { shouldShowCrownArmorSelectors } from './progressiveDisclosureAuthority'

/** Authored crown canvas (Batch 1 remaster for Modern). */
export const CROWN_ASSET_CANVAS_W = 2200
export const CROWN_ASSET_CANVAS_H = 420

/**
 * Transparent nameplate hole inside the crown canvas.
 * Authored ~9.7:1; runtime non-uniform scale maps it onto the drawn plate.
 */
/**
 * Slightly larger than the authored transparent stadium so independent X/Y scale
 * tucks ~2px of gold under the nameplate edge (MotM recessed lips, no gray gap).
 * Visual hole in PNGs remains ~471,69,1259×130.
 */
export const CROWN_ASSET_SLOT = { x: 469, y: 67, w: 1263, h: 134 } as const

/** Near-white threshold for edge flood-fill knockout (ChatGPT assets ship on opaque white). */
export const CROWN_WHITE_KEY_THRESHOLD = 245

export type CrownStageRect = { x: number; y: number; w: number; h: number }

export type CrownSlotRect = { x: number; y: number; w: number; h: number }

export function shouldRenderNameplateCrown(input: {
  layout: LayoutId
  currentLayout?: CardLayoutMode
  crownAssetId: string
}): boolean {
  if (!String(input.crownAssetId ?? '').trim()) return false
  if (!shouldShowCrownArmorSelectors({ layout: input.layout })) return false
  const { supportsNamePlateBox } = getActiveLayoutCapabilitiesFromState({
    currentLayout: input.currentLayout,
    cardData: { layout: input.layout },
  })
  return supportsNamePlateBox
}

function plateOuterFromInner(inner: { x: number; y: number; width: number; height: number }): CrownStageRect {
  return {
    x: inner.x - BEVEL_INSET,
    y: inner.y - BEVEL_INSET,
    w: inner.width + 2 * BEVEL_INSET,
    h: inner.height + 2 * BEVEL_INSET,
  }
}

/**
 * Drawn nameplate outer the crown hole must match — same art-aligned box as NamePlateLayer.
 */
export function resolveCrownNamePlateOuter(input: {
  layout: LayoutId
  currentLayout?: CardLayoutMode
  bezierPlateEnabled?: boolean
  nameBarShape?: NameplateBoxShape
}): CrownStageRect | null {
  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout: input.currentLayout,
    cardData: { layout: input.layout },
  })
  if (!caps.supportsNamePlateBox) return null

  const regions = getActiveLayoutRegionsFromState({
    currentLayout: input.currentLayout,
    cardData: { layout: input.layout },
  })
  const g = getStandardLayoutGeometry()

  let base: CrownStageRect
  if (caps.supportsModernDummyLayout || caps.useLandFullArtManaCircle || caps.supportsSagaClassChrome) {
    base = plateOuterFromInner(layoutRegionToStageRect(regions.nameBar))
  } else {
    base = { x: g.nameX, y: g.nameY, w: g.nameW, h: g.nameH }
  }

  // Land full-art mana circle keeps contract outer (no art-column end caps).
  if (caps.useLandFullArtManaCircle) return base

  let artAperture: { x: number; width: number } | null = null
  if (caps.supportsPlaneswalkerModernV2Layout) {
    const art = getPlaneswalkerModernV2ArtOuterRect()
    artAperture = { x: art.x, width: art.width }
  } else if (caps.supportsSagaClassChrome) {
    const nameInner = layoutRegionToStageRect(regions.nameBar)
    artAperture = { x: nameInner.x, width: nameInner.width }
  } else if (caps.supportsModernDummyLayout) {
    const art = buildModernDummyStageRects().art
    artAperture = {
      x: art.x - BEVEL_INSET,
      width: art.width + 2 * BEVEL_INSET,
    }
  } else {
    artAperture = { x: g.artX, width: g.artW }
  }

  if (!artAperture) return base

  const plateBarRadius = caps.supportsPlaneswalkerModernV2Layout
    ? Math.round(g.barRadius * PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER)
    : g.barRadius
  const shape = resolveEffectiveNameplateShape(
    input.bezierPlateEnabled !== false,
    input.nameBarShape ?? 'reverseBezierPlate',
  )
  const aligned = resolveArtAlignedPlateOuterRect({
    artX: artAperture.x,
    artW: artAperture.width,
    plateY: base.y,
    plateH: base.h,
    shape,
    barRadius: plateBarRadius,
  })
  return { x: aligned.x, y: aligned.y, w: aligned.width, h: aligned.height }
}

/**
 * Map crown image → stage so `slot` (in image px) lands exactly on `plate`.
 * Independent X/Y scale so art-aligned plates (wider than 1260) still fill the hole.
 */
export function resolveCrownDrawRect(
  plate: CrownStageRect,
  naturalWidth: number,
  naturalHeight: number,
  slot: CrownSlotRect = CROWN_ASSET_SLOT,
): CrownStageRect {
  const nw = Math.max(1, naturalWidth)
  const nh = Math.max(1, naturalHeight)
  const sw = Math.max(1, slot.w)
  const sh = Math.max(1, slot.h)
  const scaleX = plate.w / sw
  const scaleY = plate.h / sh
  return {
    x: plate.x - slot.x * scaleX,
    y: plate.y - slot.y * scaleY,
    w: nw * scaleX,
    h: nh * scaleY,
  }
}

/**
 * Flood-fill near-white from image edges → alpha 0 so flourishes composite over art.
 * Does not punch holes in interior silver highlights that aren't connected to the edge.
 */
export function knockOutCrownWhiteBackground(
  source: CanvasImageSource,
  width: number,
  height: number,
  threshold = CROWN_WHITE_KEY_THRESHOLD,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(width))
  canvas.height = Math.max(1, Math.floor(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const w = canvas.width
  const h = canvas.height
  const visited = new Uint8Array(w * h)
  const queue: number[] = []

  const isBg = (pixelIndex: number) =>
    data[pixelIndex] >= threshold &&
    data[pixelIndex + 1] >= threshold &&
    data[pixelIndex + 2] >= threshold

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const idx = y * w + x
    if (visited[idx]) return
    const pi = idx * 4
    if (!isBg(pi)) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < w; x += 1) {
    enqueue(x, 0)
    enqueue(x, h - 1)
  }
  for (let y = 0; y < h; y += 1) {
    enqueue(0, y)
    enqueue(w - 1, y)
  }

  while (queue.length > 0) {
    const idx = queue.pop()!
    const pi = idx * 4
    data[pi + 3] = 0
    const x = idx % w
    const y = (idx / w) | 0
    enqueue(x - 1, y)
    enqueue(x + 1, y)
    enqueue(x, y - 1)
    enqueue(x, y + 1)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}
