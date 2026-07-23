/**
 * Module 6.1 / 6.3 — Raised plate silhouette for name, type, and P/T boxes.
 * - `rounded`: legacy quadratic rounded rectangle.
 * - `bezierPlate`: shallow inward (concave) side scallops — full-width top/bottom runs.
 * - `reverseBezierPlate`: same structure with outward (convex) side bulges — opposite curvature.
 * Legacy `capsule` in saved data maps to `bezierPlate`.
 */

export type NameplateBoxShape = 'rounded' | 'bezierPlate' | 'reverseBezierPlate'

export function normalizeNameplateBoxShape(raw: unknown): NameplateBoxShape {
  if (raw === 'reverseBezierPlate') return 'reverseBezierPlate'
  if (raw === 'bezierPlate' || raw === 'capsule') return 'bezierPlate'
  if (raw === 'rounded') return 'rounded'
  return 'reverseBezierPlate'
}

/** Effective plate silhouette when the Bezier Plate toggle is off (rounded) vs on. */
export function resolveEffectiveNameplateShape(
  bezierPlateEnabled: boolean,
  storedShape: NameplateBoxShape,
): NameplateBoxShape {
  if (!bezierPlateEnabled) return 'rounded'
  return storedShape === 'rounded' ? 'reverseBezierPlate' : storedShape
}

export function migrateBezierPlateEnabled(
  raw: unknown,
  _shapes: { nameBarShape?: unknown; typeBarShape?: unknown; ptBarShape?: unknown },
): boolean {
  if (typeof raw === 'boolean') return raw
  return true
}
