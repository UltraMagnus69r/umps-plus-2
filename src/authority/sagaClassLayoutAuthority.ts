/**
 * Saga / Class / Saga Creature split-frame chrome.
 *
 * Saga: tall art RIGHT, parchment + banner LEFT.
 * Class: opposite — tall art LEFT, parchment + banner RIGHT (CC Class orientation).
 * Saga Creature: full-width reminder under name, shorter split, creature rules + P/T below type.
 */
import { BLEED_PX, TRIM_HEIGHT, TRIM_WIDTH } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isClassLayout, isSagaCreatureLayout, isSagaLayout } from './layoutTaxonomy'

export type StageRect = { x: number; y: number; width: number; height: number }

/** Trim-norm (0–1 of 1500×2100) → stage px. */
function n(rect: { x: number; y: number; w: number; h: number }): StageRect {
  return {
    x: Math.round(rect.x * TRIM_WIDTH + BLEED_PX),
    y: Math.round(rect.y * TRIM_HEIGHT + BLEED_PX),
    width: Math.round(rect.w * TRIM_WIDTH),
    height: Math.round(rect.h * TRIM_HEIGHT),
  }
}

type Face = {
  art: { x: number; y: number; w: number; h: number }
  parchment: { x: number; y: number; w: number; h: number }
  banner: { x: number; y: number; w: number; h: number }
  reminder: { x: number; y: number; w: number; h: number }
  abilityCol: { x: number; y: number; w: number; h: number }
  badge: { x: number; w: number; h: number }
}

/**
 * Saga Regular — text left / art right.
 * Reminder band kept short so I–III get equal remaining height.
 */
const FACE_SAGA: Face = {
  art: { x: 0.5015, y: 0.1137, w: 0.4199, h: 0.7221 },
  parchment: { x: 0.11, y: 0.1137, w: 0.388, h: 0.7221 },
  banner: { x: 0.044, y: 0.160, w: 0.068, h: 0.665 },
  reminder: { x: 0.0867, y: 0.1137, w: 0.404, h: 0.078 },
  abilityCol: { x: 0.1334, y: 0.200, w: 0.35, h: 0.625 },
  badge: { x: 0.0386, w: 0.0787, h: 0.0629 },
}

/** Class — art left / text right (mirror of Saga). */
const FACE_CLASS: Face = {
  art: { x: 0.0786, y: 0.1137, w: 0.4199, h: 0.7221 },
  parchment: { x: 0.502, y: 0.1137, w: 0.388, h: 0.7221 },
  banner: { x: 0.888, y: 0.160, w: 0.068, h: 0.665 },
  reminder: { x: 0.5093, y: 0.1137, w: 0.404, h: 0.078 },
  abilityCol: { x: 0.5166, y: 0.200, w: 0.35, h: 0.625 },
  badge: { x: 0.8827, w: 0.0787, h: 0.0629 },
}

/** Esper Terra–style Saga Creature face. */
const FACE_CREATURE: Face = {
  art: { x: 0.5015, y: 0.198, w: 0.4218, h: 0.528 },
  parchment: { x: 0.0767, y: 0.198, w: 0.421, h: 0.528 },
  banner: { x: 0.044, y: 0.215, w: 0.068, h: 0.492 },
  reminder: { x: 0.0767, y: 0.1129, w: 0.8476, h: 0.078 },
  abilityCol: { x: 0.118, y: 0.215, w: 0.368, h: 0.498 },
  badge: { x: 0.0386, w: 0.0787, h: 0.052 },
}

export const SAGA_DEFAULT_REMINDER =
  '(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)'

export const SAGA_CREATURE_DEFAULT_REMINDER =
  '(As this Saga enters and after your draw step, add a lore counter.)'

export const CLASS_DEFAULT_REMINDER =
  '(Gain the next level as a sorcery to add its ability.)'

export function layoutUsesSagaClassChrome(layout: Partial<LayoutId> | null | undefined): boolean {
  return isSagaLayout(layout) || isClassLayout(layout) || isSagaCreatureLayout(layout)
}

function faceFor(layout: Partial<LayoutId> | null | undefined): Face {
  if (isSagaCreatureLayout(layout)) return FACE_CREATURE
  if (isClassLayout(layout)) return FACE_CLASS
  return FACE_SAGA
}

export function getSagaClassArtRect(layout?: Partial<LayoutId> | null): StageRect {
  return n(faceFor(layout).art)
}

export function getSagaClassParchmentRect(layout?: Partial<LayoutId> | null): StageRect {
  return n(faceFor(layout).parchment)
}

export function getSagaClassBannerRect(layout?: Partial<LayoutId> | null): StageRect {
  return n(faceFor(layout).banner)
}

export function getSagaClassReminderRect(layout?: Partial<LayoutId> | null): StageRect {
  return n(faceFor(layout).reminder)
}

export function getSagaClassAbilityColumnRect(layout?: Partial<LayoutId> | null): StageRect {
  return n(faceFor(layout).abilityCol)
}

export function getSagaClassBadgeMetrics(layout?: Partial<LayoutId> | null): {
  x: number
  width: number
  height: number
} {
  const face = faceFor(layout)
  return {
    x: Math.round(face.badge.x * TRIM_WIDTH + BLEED_PX),
    width: Math.round(face.badge.w * TRIM_WIDTH),
    height: Math.round(face.badge.h * TRIM_HEIGHT),
  }
}

/** Equal chapter/level bands inside the ability column (3 for saga/class, up to 4 for creature). */
export function getSagaClassChapterBandRects(
  count = 3,
  layout?: Partial<LayoutId> | null,
): StageRect[] {
  const col = getSagaClassAbilityColumnRect(layout)
  const nBands = Math.max(1, Math.min(4, count))
  const h = Math.floor(col.height / nBands)
  const out: StageRect[] = []
  for (let i = 0; i < nBands; i++) {
    const y = col.y + i * h
    const height = i === nBands - 1 ? col.y + col.height - y : h
    out.push({ x: col.x, y, width: col.width, height })
  }
  return out
}

export function romanNumeral(n: number): string {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let v = Math.max(1, Math.min(20, Math.round(n)))
  let s = ''
  for (const [val, num] of map) {
    while (v >= val) {
      s += num
      v -= val
    }
  }
  return s
}

/**
 * Banner silhouette in local coords (0,0 = banner rect top-left).
 * Top: soft rising curve; bottom: chevron tip.
 * Pass `mirrorX` for Class (banner on the right).
 */
export function addSagaBannerPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts?: { flatTop?: boolean; mirrorX?: boolean },
): void {
  const flatTop = opts?.flatTop === true
  const mirrorX = opts?.mirrorX === true
  if (mirrorX) {
    ctx.save()
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }

  const topLeftY = 0
  const topRightY = flatTop ? 0 : h * 0.168
  const tipY = h
  const tipX = w * 0.5
  const botLeftY = h * 0.945
  const botRightY = h * 0.945

  ctx.moveTo(0, topLeftY)
  if (flatTop) {
    ctx.lineTo(w, topRightY)
  } else {
    ctx.bezierCurveTo(w * 0.22, topLeftY + 2, w * 0.55, topRightY * 0.55, w, topRightY)
  }
  ctx.lineTo(w, botRightY)
  ctx.lineTo(tipX, tipY)
  ctx.lineTo(0, botLeftY)
  ctx.closePath()

  if (mirrorX) ctx.restore()
}
