/**
 * Space Gothic layout geometry — cream plate holes measured on source PNGs,
 * scaled uniformly to trim 1500×2100 (same aspect as 1060×1484), then +75 bleed
 * into the 1650×2250 stage. Frame PNG is drawn in the trim rect (not stretched into bleed).
 */
import { BLEED_PX, STAGE_HEIGHT, STAGE_WIDTH, TRIM_HEIGHT, TRIM_WIDTH } from './geometryAuthority'
import {
  getSpaceGothicFrameOption,
  type SpaceGothicFrameVariantId,
} from '../data/spaceGothicFrameOptions'

export type SpaceGothicStageRect = { x: number; y: number; width: number; height: number }

/** Trim placement for the frame PNG on stage (bleed outside stays matte). */
export const SPACE_GOTHIC_FRAME_TRIM_RECT: SpaceGothicStageRect = {
  x: BLEED_PX,
  y: BLEED_PX,
  width: TRIM_WIDTH,
  height: TRIM_HEIGHT,
}

/**
 * Seats authored as stage px (trim measure + BLEED).
 * Primary / With P/T — `space-gothic-with-pt.png` (1060×1484 → trim).
 */
const WITH_PT = {
  art: { x: 130, y: 364, width: 1390, height: 859 },
  nameBar: { x: 143, y: 258, width: 1364, height: 88 },
  typeLine: { x: 129, y: 1254, width: 1392, height: 83 },
  /** Ends above the BR P/T pocket so oracle text clears the pill. */
  rulesText: { x: 129, y: 1375, width: 1392, height: 449 },
  metadataStrip: { x: 140, y: 2060, width: 900, height: 48 },
  lowerRight: { x: 1156, y: 1844, width: 243, height: 88 },
} as const satisfies Record<string, SpaceGothicStageRect>

/** With Sides — side pillars; name + thin type + footer rules band. */
const WITH_SIDES = {
  art: { x: 215, y: 364, width: 1220, height: 1425 },
  nameBar: { x: 139, y: 235, width: 1373, height: 112 },
  typeLine: { x: 163, y: 1817, width: 1325, height: 51 },
  rulesText: { x: 139, y: 1883, width: 1373, height: 103 },
  metadataStrip: { x: 160, y: 2060, width: 900, height: 40 },
  lowerRight: { x: 1200, y: 2060, width: 1, height: 1 },
} as const satisfies Record<string, SpaceGothicStageRect>

/** Name / Type / Rules — joined bottom block, no P/T pocket. */
const NAME_TYPE_RULES = {
  art: { x: 130, y: 307, width: 1390, height: 1015 },
  nameBar: { x: 119, y: 200, width: 1412, height: 91 },
  typeLine: { x: 132, y: 1353, width: 1400, height: 91 },
  rulesText: { x: 112, y: 1466, width: 1426, height: 536 },
  metadataStrip: { x: 140, y: 2060, width: 900, height: 48 },
  lowerRight: { x: 1200, y: 2060, width: 1, height: 1 },
} as const satisfies Record<string, SpaceGothicStageRect>

/**
 * Nameplate + Footer (trim-native 1500×2100) — name capsule + bottom flourish only.
 * Type / rules float in the open art void above the footer.
 */
const NAMEPLATE_FOOTER = {
  art: { x: 119, y: 309, width: 1412, height: 1582 },
  nameBar: { x: 123, y: 199, width: 1404, height: 92 },
  typeLine: { x: 180, y: 1680, width: 1290, height: 70 },
  rulesText: { x: 180, y: 1760, width: 1290, height: 140 },
  metadataStrip: { x: 162, y: 1919, width: 900, height: 48 },
  lowerRight: { x: 1200, y: 2060, width: 1, height: 1 },
} as const satisfies Record<string, SpaceGothicStageRect>

const VARIANT_RECTS: Record<
  SpaceGothicFrameVariantId,
  {
    art: SpaceGothicStageRect
    nameBar: SpaceGothicStageRect
    typeLine: SpaceGothicStageRect
    rulesText: SpaceGothicStageRect
    metadataStrip: SpaceGothicStageRect
    lowerRight: SpaceGothicStageRect
  }
> = {
  'with-pt': WITH_PT,
  'with-sides': WITH_SIDES,
  'name-type-rules': NAME_TYPE_RULES,
  'nameplate-footer': NAMEPLATE_FOOTER,
}

export function buildSpaceGothicStageRects(variantId: unknown): {
  art: SpaceGothicStageRect
  nameBar: SpaceGothicStageRect
  typeLine: SpaceGothicStageRect
  rulesText: SpaceGothicStageRect
  metadataStrip: SpaceGothicStageRect
  lowerRight: SpaceGothicStageRect
} {
  const opt = getSpaceGothicFrameOption(variantId)
  return VARIANT_RECTS[opt.id]
}

export function spaceGothicVariantHasPtPocket(variantId: unknown): boolean {
  return getSpaceGothicFrameOption(variantId).hasPtPocket
}

/** Full-stage size reference (matte/bleed); PNG itself sits in SPACE_GOTHIC_FRAME_TRIM_RECT. */
export const SPACE_GOTHIC_FRAME_STAGE_SIZE = { width: STAGE_WIDTH, height: STAGE_HEIGHT } as const
