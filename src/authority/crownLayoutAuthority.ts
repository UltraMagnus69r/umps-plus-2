/**
 * Modern nameplate crown placement.
 * Crown PNGs sit behind the raised name plate (Showcase-style) and over art.
 *
 * Assets are authored so a transparent nameplate slot maps 1:1 onto the Modern
 * outer plate (see CROWN_ASSET_*). Placement scales/positions by that slot —
 * never by the full canvas — so the plate sits in the hole.
 */

import { BEVEL_INSET, getStandardLayoutGeometry, type CardLayoutMode } from './geometryAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from './layoutRegistry'
import type { LayoutId } from './layoutTaxonomy'
import { shouldShowCrownArmorSelectors } from './progressiveDisclosureAuthority'

/** Authored crown canvas (Batch 1 remaster for Modern). */
export const CROWN_ASSET_CANVAS_W = 2200
export const CROWN_ASSET_CANVAS_H = 420

/** Transparent nameplate hole inside the crown canvas (matches Modern outer plate 1288×95). */
export const CROWN_ASSET_SLOT = { x: 456, y: 110, w: 1288, h: 95 } as const

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

/** Same outer nameplate rect FrameLayer uses for Modern / Borderless / Modern V2. */
export function resolveCrownNamePlateOuter(input: {
  layout: LayoutId
  currentLayout?: CardLayoutMode
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

  if (caps.supportsModernDummyLayout || caps.useLandFullArtManaCircle) {
    return plateOuterFromInner(layoutRegionToStageRect(regions.nameBar))
  }

  const g = getStandardLayoutGeometry()
  return { x: g.nameX, y: g.nameY, w: g.nameW, h: g.nameH }
}

/**
 * Map crown image → stage so `slot` (in image px) lands exactly on `plate`.
 * Uniform scale from the tighter of width/height so the hole never undersizes the plate.
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
  // Prefer width lock (name length / plate width); allow slight vertical overshoot of slot vs plate.
  const scale = plate.w / sw
  const w = nw * scale
  const h = nh * scale
  const slotOnStageX = slot.x * scale
  const slotOnStageY = slot.y * scale
  return {
    x: plate.x - slotOnStageX,
    y: plate.y - slotOnStageY,
    w,
    h,
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
