/**
 * Name / type plate ↔ art column alignment.
 *
 * For raised plates, the flat top/bottom run (where curves begin) must match the
 * art box left/right. Capsule / reverse-Bezier ends sit outside that span.
 *
 * Pass the *visible* art aperture (same L/R as the art window the user sees —
 * typically the art-frame outer, not a further-inset content pad).
 */
import { BEVEL_INSET } from './geometryAuthority'
import type { NameplateBoxShape } from './nameplateShapeAuthority'
import {
  PLATE_BEZIER_DEPTH_RATIO,
  REVERSE_PLATE_DEPTH_MULTIPLIER,
} from './plateBezierContourAuthority'

export type StageRect = { x: number; y: number; width: number; height: number }

/** Outward end-cap depth for reverse-Bezier plates (matches path construction). */
export function reverseBezierPlateEndCapPx(plateOuterH: number): number {
  const m = Math.max(1, plateOuterH)
  const depthRatio = PLATE_BEZIER_DEPTH_RATIO * REVERSE_PLATE_DEPTH_MULTIPLIER
  return Math.max(0, Math.min(m * depthRatio, m * 0.48))
}

/**
 * Horizontal end-cap allowance so curve starts can sit on the art L/R edges.
 * - reverseBezierPlate: outward bulge depth
 * - rounded: corner radius (flat = width − 2r)
 * - bezierPlate (inward): top/bottom already full-box; box width = art width
 *
 * Always reserve at least {@link BEVEL_INSET} so nested bevel/cream passes are not
 * clamped inside the art column.
 */
export function plateEndCapPxForShape(
  shape: NameplateBoxShape,
  plateOuterH: number,
  barRadius: number,
): number {
  let cap = 0
  if (shape === 'reverseBezierPlate') {
    cap = Math.ceil(reverseBezierPlateEndCapPx(plateOuterH))
  } else if (shape === 'rounded') {
    cap = Math.max(0, Math.min(Math.round(barRadius), Math.floor(plateOuterH / 2)))
  } else {
    // bezierPlate (inward): still need room so inner cream flats are not clamped.
    cap = BEVEL_INSET
  }
  return Math.max(cap, BEVEL_INSET)
}

/**
 * Plate outer box whose flat span equals the art column; ends may extend outside.
 */
export function resolveArtAlignedPlateOuterRect(input: {
  artX: number
  artW: number
  plateY: number
  plateH: number
  shape: NameplateBoxShape
  barRadius: number
}): StageRect & { flatX: number; flatW: number; endCapPx: number } {
  const flatX = Math.round(input.artX)
  const flatW = Math.max(1, Math.round(input.artW))
  const endCapPx = plateEndCapPxForShape(input.shape, input.plateH, input.barRadius)
  return {
    x: flatX - endCapPx,
    y: input.plateY,
    width: flatW + 2 * endCapPx,
    height: input.plateH,
    flatX,
    flatW,
    endCapPx,
  }
}
