/**
 * Saga / Class / Saga Creature split-frame chrome.
 *
 * Regular Saga/Class: tall art RIGHT, parchment + banner LEFT (fidelity refs).
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

/**
 * Shared face geometry (Saga Regular / Class-as-ref).
 * Banner + parchment from sagaMaskBanner + sagaFrame hole; art from pack artBounds.
 */
const FACE = {
  art: { x: 0.5015, y: 0.1137, w: 0.4199, h: 0.7221 },
  name: { x: 0.0854, y: 0.0522, w: 0.8292, h: 0.0543 },
  type: { x: 0.0854, y: 0.8481, w: 0.8292, h: 0.0543 },
  parchment: { x: 0.11, y: 0.1137, w: 0.388, h: 0.7221 },
  banner: { x: 0.044, y: 0.1714, w: 0.068, h: 0.661 },
  reminder: { x: 0.0867, y: 0.1129, w: 0.404, h: 0.1772 },
  abilityCol: { x: 0.1334, y: 0.2896, w: 0.35, h: 0.535 },
  badge: { x: 0.0386, w: 0.0787, h: 0.0629 },
} as const

/** Esper Terra–style Saga Creature face (measured from fidelity reference). */
const FACE_CREATURE = {
  art: { x: 0.5015, y: 0.198, w: 0.4218, h: 0.528 },
  parchment: { x: 0.0767, y: 0.198, w: 0.421, h: 0.528 },
  banner: { x: 0.044, y: 0.215, w: 0.068, h: 0.492 },
  /** Full-width strip under the name bar. */
  reminder: { x: 0.0767, y: 0.1129, w: 0.8476, h: 0.078 },
  abilityCol: { x: 0.118, y: 0.215, w: 0.368, h: 0.498 },
  badge: { x: 0.0386, w: 0.0787, h: 0.052 },
} as const

export const SAGA_DEFAULT_REMINDER =
  '(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)'

export const SAGA_CREATURE_DEFAULT_REMINDER =
  '(As this Saga enters and after your draw step, add a lore counter.)'

export const CLASS_DEFAULT_REMINDER =
  '(Gain the next level as a sorcery to add its ability.)'

export function layoutUsesSagaClassChrome(layout: Partial<LayoutId> | null | undefined): boolean {
  return isSagaLayout(layout) || isClassLayout(layout) || isSagaCreatureLayout(layout)
}

function faceFor(layout: Partial<LayoutId> | null | undefined) {
  return isSagaCreatureLayout(layout) ? FACE_CREATURE : FACE
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

/** Chapter/level bands inside the ability column (3 for saga/class, 4 for saga-creature). */
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
 * Top: soft rising curve (left high under name plate → right lower into parchment).
 * Bottom: chevron tip (matches sagaMaskBanner / fidelity refs).
 */
export function addSagaBannerPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts?: { flatTop?: boolean },
): void {
  const flatTop = opts?.flatTop === true
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
}
