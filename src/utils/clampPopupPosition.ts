/** Keep a fixed-position overlay fully inside the viewport with a small margin. */
export function clampPopupPosition(
  top: number,
  left: number,
  width: number,
  height: number,
  margin = 8,
): { top: number; left: number } {
  if (typeof window === 'undefined') return { top, left }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxLeft = Math.max(margin, vw - width - margin)
  const maxTop = Math.max(margin, vh - height - margin)
  return {
    top: Math.min(maxTop, Math.max(margin, top)),
    left: Math.min(maxLeft, Math.max(margin, left)),
  }
}
