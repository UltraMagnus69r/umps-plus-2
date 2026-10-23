/**
 * Battle / Siege — landscape MotM stack face (wider than tall).
 * Ground truth: Invasion of Zendikar (MOM #194) measured landscape play —
 * Project face-spec + media/battle-zendikar-compare/zendikar-measurements.json.
 * Same MotM stack family as Ikoria; seats are Zendikar-measured (not a
 * left-name / right-column FACE). Art left-insets for the collector strip;
 * hologram / MotM left-seam stamp is optional chrome (absent on Uncommon Zendikar).
 */
import { BLEED_PX, INNER_BORDER_CORNER_RADIUS_MODERN } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isBattleLayout } from './layoutTaxonomy'

export const BATTLE_TRIM_WIDTH = 2100
export const BATTLE_TRIM_HEIGHT = 1500
export const BATTLE_STAGE_WIDTH = BATTLE_TRIM_WIDTH + 2 * BLEED_PX // 2250
export const BATTLE_STAGE_HEIGHT = BATTLE_TRIM_HEIGHT + 2 * BLEED_PX // 1650

/** Modern bottom inner-border radius (stage px) — used for Battle landscape left corners. */
export const BATTLE_INNER_BORDER_LEFT_CORNER_RADIUS =
  INNER_BORDER_CORNER_RADIUS_MODERN[2] /* bottom-right = bottom radius language */
/** Modern top inner-border radius — used for Battle landscape right corners. */
export const BATTLE_INNER_BORDER_RIGHT_CORNER_RADIUS = INNER_BORDER_CORNER_RADIUS_MODERN[0]

export type BattleStageRect = { x: number; y: number; width: number; height: number }

/** Landscape trim-norm (0–1 of 2100×1500) → stage px. */
function n(rect: { x: number; y: number; w: number; h: number }): BattleStageRect {
  return {
    x: Math.round(rect.x * BATTLE_TRIM_WIDTH + BLEED_PX),
    y: Math.round(rect.y * BATTLE_TRIM_HEIGHT + BLEED_PX),
    width: Math.round(rect.w * BATTLE_TRIM_WIDTH),
    height: Math.round(rect.h * BATTLE_TRIM_HEIGHT),
  }
}

/**
 * Zendikar-measured MotM stack (trim px → norm of 2100×1500).
 * Stage = trim + BLEED 75. See battle-zendikar-face-spec.md.
 */
const FACE = {
  /** Left vertical collector / legal strip in the black outer border. */
  collector: { x: 8 / 2100, y: 91 / 1500, w: 202 / 2100, h: 1319 / 1500 },
  /** Horizontal nameplate — green chrome + fill. */
  name: { x: 218 / 2100, y: 58 / 1500, w: 1823 / 2100, h: 141 / 1500 },
  /** DFC / transform mark — circle + △ at left of name. */
  transform: { x: 218 / 2100, y: 58 / 1500, w: 141 / 2100, h: 141 / 1500 },
  /** Mana cluster at right of name. */
  mana: { x: 1793 / 2100, y: 77 / 1500, w: 222 / 2100, h: 105 / 1500 },
  /**
   * Art full cover under chrome (left inset clears collector; top/right/bottom
   * match inner face). Visible hole between name bottom & type top is chrome.
   */
  art: { x: 218 / 2100, y: 58 / 1500, w: 1823 / 2100, h: 1383 / 1500 },
  /** Type line — full-width plate over rules. */
  type: { x: 218 / 2100, y: 866 / 1500, w: 1823 / 2100, h: 135 / 1500 },
  /** Set symbol — right end of type. */
  setSymbol: { x: 1934 / 2100, y: 882 / 1500, w: 91 / 2100, h: 101 / 1500 },
  /** Rules outer box — tall translucent panel. */
  rules: { x: 218 / 2100, y: 1001 / 1500, w: 1823 / 2100, h: 441 / 1500 },
  /** Defense shield — spiked badge, bottom-right of rules / inner face. */
  defense: { x: 1894 / 2100, y: 1319 / 1500, w: 133 / 2100, h: 133 / 1500 },
  /** Back-face P/T cue (e.g. 4/4) — left of defense in rules. */
  backFacePT: { x: 1787 / 2100, y: 1313 / 1500, w: 105 / 2100, h: 48 / 1500 },
  /**
   * Optional MotM security stamp — straddles art left seam.
   * Not present on Uncommon Zendikar; keep for rare/mythic / toggle.
   */
  hologram: {
    x: 218 / 2100 - 68 / 2100 / 2,
    y: 58 / 1500 + 1383 / 1500 / 2 - 110 / 1500 / 2,
    w: 68 / 2100,
    h: 110 / 1500,
  },
} as const

/**
 * Extra trim-px on top/bottom left-corner tangents (arc starts later to the right).
 * Vertical left-edge anchors stay put.
 */
export const BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX = 50

export function layoutUsesBattleChrome(layout: Partial<LayoutId> | null | undefined): boolean {
  return isBattleLayout(layout)
}

export function getBattleStageSize(): { width: number; height: number } {
  return { width: BATTLE_STAGE_WIDTH, height: BATTLE_STAGE_HEIGHT }
}

/**
 * Art aperture — Zendikar art_full under name/type/rules/defense.
 * Identical to {@link getBattleInnerBorderRect}. ArtLayer cover-fills + clips this;
 * chrome evenodd hole matches so the left strip stays black for collector.
 */
export function getBattleArtRect(): BattleStageRect {
  return getBattleInnerBorderRect()
}

/**
 * Art / chrome-hole aperture (stage px) — ArtLayer clip and chrome frame-ring hole
 * share this rect and the Battle corner radii (including left tangent extra).
 */
export function getBattleInnerBorderRect(): BattleStageRect {
  return n(FACE.art)
}

export function getBattleNameRect(): BattleStageRect {
  return n(FACE.name)
}

export function getBattleManaRect(): BattleStageRect {
  return n(FACE.mana)
}

export function getBattleTransformRect(): BattleStageRect {
  return n(FACE.transform)
}

export function getBattleTypeRect(): BattleStageRect {
  return n(FACE.type)
}

export function getBattleSetSymbolRect(): BattleStageRect {
  return n(FACE.setSymbol)
}

export function getBattleRulesRect(): BattleStageRect {
  return n(FACE.rules)
}

export function getBattleDefenseRect(): BattleStageRect {
  return n(FACE.defense)
}

/** Back-face power/toughness cue seat (left of defense). */
export function getBattleBackFacePTRect(): BattleStageRect {
  return n(FACE.backFacePT)
}

export function getBattleCollectorRect(): BattleStageRect {
  return n(FACE.collector)
}

export function getBattleHologramRect(): BattleStageRect {
  return n(FACE.hologram)
}

export function getBattleTrimRect(): BattleStageRect {
  return {
    x: BLEED_PX,
    y: BLEED_PX,
    width: BATTLE_TRIM_WIDTH,
    height: BATTLE_TRIM_HEIGHT,
  }
}

/**
 * Konva/canvas corner radii for the Battle inner mat (TL, TR, BR, BL).
 * Upper-left + lower-left match Standard Modern bottom inner-border radius.
 * Left corners also use {@link BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX} on the
 * top/bottom tangent (horizontal) so the arc starts ~50 px later.
 */
export function getBattleInnerBorderCornerRadii(): readonly [number, number, number, number] {
  const left = BATTLE_INNER_BORDER_LEFT_CORNER_RADIUS
  const right = BATTLE_INNER_BORDER_RIGHT_CORNER_RADIUS
  return [left, right, right, left]
}

/** Horizontal tangent inset for left corners (= vertical radius + 50 px). */
export function getBattleLeftCornerHorizontalRadius(): number {
  return BATTLE_INNER_BORDER_LEFT_CORNER_RADIUS + BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX
}

/** Default Siege reminder (Scryfall / oracle). */
export const BATTLE_SIEGE_DEFAULT_REMINDER =
  "(As a Siege enters, choose an opponent to protect it. You and others can attack it. When it's defeated, exile it, then cast it transformed.)"

export function normalizeBattleDefense(value: unknown): string {
  return String(value ?? '').trim()
}

/** Format back-face P/T cue when both sides are present (e.g. "4/4"). */
export function formatBattleBackFacePT(power: unknown, toughness: unknown): string {
  const p = String(power ?? '').trim()
  const t = String(toughness ?? '').trim()
  if (!p || !t) return ''
  return `${p}/${t}`
}
