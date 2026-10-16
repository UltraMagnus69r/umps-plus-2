/**
 * PKMN layout geometry — art window measured from transparent region of the
 * 1650×2250 pre-made frame PNGs; text slots sit on the baked light panels.
 */
import { STAGE_HEIGHT, STAGE_WIDTH } from './geometryAuthority'

export type PkmnStageRect = { x: number; y: number; width: number; height: number }

/** Transparent art aperture (alpha≈0) shared across PKMN frame variants. */
export const PKMN_ART_RECT: PkmnStageRect = {
  x: 170,
  y: 310,
  width: 1308,
  height: 812,
}

/** Name plate band above the art window. */
export const PKMN_NAME_BAR_RECT: PkmnStageRect = {
  x: 190,
  y: 185,
  width: 1270,
  height: 75,
}

/**
 * Extra left pad so the name clears the decorative silver endcap/blob on the
 * name plate. Live White-frame measure: cream plate interior starts ~x 318;
 * inset seats text at nameBar.x + inset (≈380) with a clear gap past the tip.
 */
export const PKMN_NAME_TEXT_LEFT_INSET = 190

/** PKMN-only: nudge flavor lines down within the rules panel (stage px). */
export const PKMN_FLAVOR_Y_NUDGE = 5

/** Type line band between art and rules. */
export const PKMN_TYPE_LINE_RECT: PkmnStageRect = {
  x: 190,
  y: 1175,
  width: 1270,
  height: 70,
}

/** Rules / oracle text area on the lower light panel. */
export const PKMN_RULES_TEXT_RECT: PkmnStageRect = {
  x: 200,
  y: 1335,
  width: 1250,
  height: 560,
}

/**
 * Collector / metadata strip — recessed cream/silver footer box on the pre-made
 * frame, shared horizontal row with the P/T pill (immediately LEFT of it).
 * Measured on White 1650×2250: interior ~y 1972–2060, x ~170–1185 before the
 * P/T gap. Do NOT use the outer brushed chrome below (~y 2120+) or the thin
 * band between rules and this row — those leave this box empty.
 */
export const PKMN_METADATA_RECT: PkmnStageRect = {
  x: 220,
  y: 1982,
  width: 960,
  height: 72,
}

/** Mid-tone of the PKMN cream collector strip — forces dark readable ink. */
export const PKMN_COLLECTOR_BAR_CONTRAST_HEX = '#d8c9a8'

/** PKMN-only: shift the right-aligned copyright glyphs left within the strip. */
export const PKMN_COPYRIGHT_LEFT_NUDGE_PX = 5

/**
 * Power / toughness slot — baked pill on the pre-made frame.
 * Horizontal center aligns with the pill’s vertical divider (~x 1343).
 */
export const PKMN_PT_RECT: PkmnStageRect = {
  x: 1200,
  y: 1970,
  width: 286,
  height: 88,
}

/**
 * PKMN basic-land full-art frames (Forest/Island/…) — measured on cropped
 * 1500×2100 face then offset by 75 px bleed into the 1650×2250 stage.
 * Nameplate text is baked; art fills the face below the name bar (no rules box).
 */
export const PKMN_LAND_NAME_BAR_RECT: PkmnStageRect = {
  x: 165,
  y: 175,
  width: 1320,
  height: 95,
}

/** Full-art window under the baked nameplate (opaque frame; no alpha hole). */
export const PKMN_LAND_ART_RECT: PkmnStageRect = {
  x: 180,
  y: 280,
  width: 1290,
  height: 1720,
}

/** Unused type/rules/metadata/PT slots — kept for contract completeness. */
export const PKMN_LAND_TYPE_LINE_RECT: PkmnStageRect = {
  x: 180,
  y: 280,
  width: 1290,
  height: 1,
}

export const PKMN_LAND_RULES_TEXT_RECT: PkmnStageRect = {
  x: 180,
  y: 2000,
  width: 1290,
  height: 1,
}

export const PKMN_LAND_METADATA_RECT: PkmnStageRect = {
  x: 180,
  y: 2100,
  width: 900,
  height: 1,
}

export const PKMN_LAND_PT_RECT: PkmnStageRect = {
  x: 1200,
  y: 2100,
  width: 1,
  height: 1,
}

export function buildPkmnStageRects(): {
  art: PkmnStageRect
  nameBar: PkmnStageRect
  typeLine: PkmnStageRect
  rulesText: PkmnStageRect
  metadataStrip: PkmnStageRect
  lowerRight: PkmnStageRect
} {
  return {
    art: PKMN_ART_RECT,
    nameBar: PKMN_NAME_BAR_RECT,
    typeLine: PKMN_TYPE_LINE_RECT,
    rulesText: PKMN_RULES_TEXT_RECT,
    metadataStrip: PKMN_METADATA_RECT,
    lowerRight: PKMN_PT_RECT,
  }
}

export function buildPkmnBasicLandStageRects(): {
  art: PkmnStageRect
  nameBar: PkmnStageRect
  typeLine: PkmnStageRect
  rulesText: PkmnStageRect
  metadataStrip: PkmnStageRect
  lowerRight: PkmnStageRect
} {
  return {
    art: PKMN_LAND_ART_RECT,
    nameBar: PKMN_LAND_NAME_BAR_RECT,
    typeLine: PKMN_LAND_TYPE_LINE_RECT,
    rulesText: PKMN_LAND_RULES_TEXT_RECT,
    metadataStrip: PKMN_LAND_METADATA_RECT,
    lowerRight: PKMN_LAND_PT_RECT,
  }
}

/** Full-stage draw size for the pre-made frame PNG (matches asset / stage). */
export const PKMN_FRAME_STAGE_SIZE = { width: STAGE_WIDTH, height: STAGE_HEIGHT } as const
