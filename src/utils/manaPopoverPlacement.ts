/**
 * Collision-aware placement for the PipMint mana popover.
 * Prefer fully beside the inspector inputs on desktop; top sheet on narrow
 * viewports (under header, above phone dock / pill strip). Never cover
 * keep-clear rects (name / P/T / font / cost) or the phone step pills.
 */

export type ManaPopoverPlacement =
  | {
      mode: 'popover'
      top: number
      left: number
      width: number
      maxHeight: number
    }
  | {
      mode: 'sheet'
      /** Mobile: top sheet under header. Desktop fallback: lower sheet. */
      edge: 'top' | 'bottom'
      top: number
      left: number
      width: number
      maxHeight: number
    }

const MARGIN = 10
const MOBILE_MQ = '(max-width: 719px)'

function intersects(
  a: DOMRect,
  b: { top: number; left: number; width: number; height: number },
  pad = 4,
) {
  const ar = {
    top: a.top - pad,
    left: a.left - pad,
    right: a.right + pad,
    bottom: a.bottom + pad,
  }
  const br = {
    top: b.top,
    left: b.left,
    right: b.left + b.width,
    bottom: b.top + b.height,
  }
  return !(br.right < ar.left || br.left > ar.right || br.bottom < ar.top || br.top > ar.bottom)
}

function hitsKeepClear(
  box: { top: number; left: number; width: number; height: number },
  keepClear: DOMRect[],
) {
  return keepClear.some((r) => intersects(r, box))
}

/** Chrome (title + Cost|Rules + chips) is ~180px; body needs room for the symbol grid. */
const SHEET_MIN_HEIGHT = 260

function clampTop(preferred: number, maxHeight: number, vh: number) {
  return Math.min(Math.max(MARGIN, preferred), vh - maxHeight - MARGIN)
}

function isUsableRect(r: DOMRect): boolean {
  return r.width >= 1 && r.height >= 1
}

/** Bottom of StudioTopBar — top sheets sit just under the header. */
export function findStudioHeaderBottom(): number {
  if (typeof document === 'undefined') return MARGIN
  const bar = document.querySelector<HTMLElement>('.studio-topbar')
  if (!bar) return MARGIN
  const r = bar.getBoundingClientRect()
  return isUsableRect(r) ? r.bottom : MARGIN
}

/**
 * Top of the phone inspector dock (step pills + active pill body).
 * Mana top-sheet must end above this so pills stay visible.
 */
export function findPhoneDockTop(vh: number): number | null {
  if (typeof document === 'undefined') return null
  const dock = document.querySelector<HTMLElement>('.studio-phone-dock')
  if (dock) {
    const r = dock.getBoundingClientRect()
    // Ignore display:none desktop-hidden clones (lg:hidden dock is visible on mobile).
    if (isUsableRect(r) && r.top < vh && r.top > 0) return r.top
  }
  const sheet = document.querySelector<HTMLElement>('.studio-phone-sheet')
  if (sheet) {
    const r = sheet.getBoundingClientRect()
    if (isUsableRect(r) && r.top < vh && r.top > 0) return r.top
  }
  return null
}

/** Mobile: top sheet under header, capped above the phone dock / keep-clear. */
function topSheetPlacement(
  vw: number,
  vh: number,
  preferredH: number,
  clearAboveY?: number,
  headerBottom?: number,
): ManaPopoverPlacement {
  const width = Math.min(vw - MARGIN * 2, 440)
  const top = Math.max(MARGIN, (headerBottom ?? MARGIN) + 6)
  const limitBottom =
    clearAboveY != null && Number.isFinite(clearAboveY)
      ? clearAboveY - 8
      : Math.floor(vh * 0.52)
  const avail = Math.max(120, limitBottom - top)
  const maxHeight = Math.min(
    Math.max(SHEET_MIN_HEIGHT, Math.min(preferredH, avail)),
    avail,
    vh - top - MARGIN,
  )
  const left = Math.max(MARGIN, Math.round((vw - width) / 2))
  return { mode: 'sheet', edge: 'top', top, left, width, maxHeight }
}

/** Desktop fallback: lower sheet so the upper input stack stays usable. */
function bottomSheetPlacement(
  vw: number,
  vh: number,
  preferredH: number,
  clearBelowY?: number,
): ManaPopoverPlacement {
  const width = Math.min(vw - MARGIN * 2, 440)
  const idealMinTop =
    clearBelowY != null && Number.isFinite(clearBelowY)
      ? Math.max(MARGIN, clearBelowY + 8)
      : Math.max(MARGIN, Math.floor(vh * 0.52))
  const maxHeight = Math.max(
    SHEET_MIN_HEIGHT,
    Math.min(preferredH, vh - MARGIN * 2, Math.floor(vh * 0.55)),
  )
  const topFromClear = Math.min(idealMinTop, vh - maxHeight - MARGIN)
  const top = Math.max(MARGIN, Math.min(topFromClear, vh - maxHeight - MARGIN))
  const left = Math.max(MARGIN, Math.round((vw - width) / 2))
  return { mode: 'sheet', edge: 'bottom', top, left, width, maxHeight }
}

export function computeManaPopoverPlacement(
  anchor: DOMRect,
  keepClear: DOMRect[],
  opts?: { preferredWidth?: number; preferredHeight?: number },
): ManaPopoverPlacement {
  if (typeof window === 'undefined') {
    return { mode: 'popover', top: 80, left: 80, width: 320, maxHeight: 360 }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const preferredW = opts?.preferredWidth ?? 340
  const preferredH = opts?.preferredHeight ?? 420
  const width = Math.min(preferredW, vw - MARGIN * 2)
  const maxHBudget = Math.min(preferredH, vh - MARGIN * 2)

  const keepLeft = keepClear.length ? Math.min(...keepClear.map((r) => r.left)) : anchor.left
  const keepRight = keepClear.length ? Math.max(...keepClear.map((r) => r.right)) : anchor.right
  const keepTop = keepClear.length ? Math.min(...keepClear.map((r) => r.top)) : anchor.top
  const keepBottom = keepClear.length
    ? Math.max(...keepClear.map((r) => r.bottom), anchor.bottom)
    : anchor.bottom

  if (window.matchMedia(MOBILE_MQ).matches) {
    const dockTop = findPhoneDockTop(vh)
    const headerBottom = findStudioHeaderBottom()
    // Cap above the dock (pills + editor). Also respect keep-clear if somehow higher.
    let clearAboveY = dockTop ?? Math.floor(vh * 0.52)
    if (keepClear.length) clearAboveY = Math.min(clearAboveY, keepTop)
    return topSheetPlacement(vw, vh, preferredH, clearAboveY, headerBottom)
  }

  const candidates: Array<{ top: number; left: number; width: number; maxHeight: number; score: number }> =
    []

  // 1) Fully left of the keep-clear cluster (canvas side of a right inspector)
  {
    const left = keepLeft - width - 8
    if (left >= MARGIN) {
      const maxHeight = Math.min(maxHBudget, vh - MARGIN * 2)
      const top = clampTop(anchor.top - 8, maxHeight, vh)
      const box = { top, left, width, height: maxHeight }
      if (!hitsKeepClear(box, keepClear)) {
        candidates.push({ top, left, width, maxHeight, score: 100 })
      }
    }
  }

  // 2) Fully right of the keep-clear cluster
  {
    const left = keepRight + 8
    if (left + width <= vw - MARGIN) {
      const maxHeight = Math.min(maxHBudget, vh - MARGIN * 2)
      const top = clampTop(anchor.top - 8, maxHeight, vh)
      const box = { top, left, width, height: maxHeight }
      if (!hitsKeepClear(box, keepClear)) {
        candidates.push({ top, left, width, maxHeight, score: 80 })
      }
    }
  }

  // 3) Below the lowest keep-clear / anchor — only if it clears keep-clear zones
  {
    const belowFrom = Math.max(
      anchor.bottom,
      keepClear.length ? Math.max(...keepClear.map((r) => r.bottom)) : anchor.bottom,
    )
    const top = belowFrom + 8
    const avail = vh - top - MARGIN
    if (avail >= 200) {
      const maxHeight = Math.min(maxHBudget, avail)
      const left = Math.min(Math.max(MARGIN, anchor.left), vw - width - MARGIN)
      const box = { top, left, width, height: maxHeight }
      if (!hitsKeepClear(box, keepClear)) {
        candidates.push({ top, left, width, maxHeight, score: 55 })
      }
    }
  }

  // 4) Above the keep-clear cluster (rare — only if name isn't in the way)
  {
    const avail = keepTop - MARGIN
    if (avail >= 200) {
      const maxHeight = Math.min(maxHBudget, avail)
      const top = keepTop - 8 - maxHeight
      const left = Math.min(Math.max(MARGIN, anchor.left - width), vw - width - MARGIN)
      const box = { top, left, width, height: maxHeight }
      if (!hitsKeepClear(box, keepClear)) {
        candidates.push({ top, left, width, maxHeight, score: 35 })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  if (best) {
    return {
      mode: 'popover',
      top: best.top,
      left: best.left,
      width: best.width,
      maxHeight: best.maxHeight,
    }
  }

  // Fallback: lower sheet so upper input stack stays usable
  return bottomSheetPlacement(vw, vh, preferredH, keepBottom)
}

export function collectManaKeepClearRects(): DOMRect[] {
  if (typeof document === 'undefined') return []
  // Desktop + phone inspectors both mount; ignore 0×0 (display:none / lg:hidden) clones
  // so keepLeft/keepTop are not forced to 0 and left-of-inspector placement still wins.
  return Array.from(document.querySelectorAll<HTMLElement>('[data-mana-keep-clear]'))
    .map((el) => el.getBoundingClientRect())
    .filter(isUsableRect)
}

export function findManaAnchorRect(host: string): DOMRect | null {
  if (typeof document === 'undefined') return null
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-mana-picker-entry="${host}"]`),
  )
  for (const el of nodes) {
    const r = el.getBoundingClientRect()
    if (isUsableRect(r)) return r
  }
  return null
}
