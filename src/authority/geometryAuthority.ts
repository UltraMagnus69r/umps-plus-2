/**
 * Geometry Authority — Standard card frame geometry.
 * Single source of truth for all standard card element coordinates and dimensions.
 * Dimension Authority: 600 DPI, 1650 × 2250 px North Star.
 *
 * Coordinate space: Normalized (0–1) is relative to the full 1650×2250 full-bleed stage.
 * Origin (0,0) = stage top-left; (1,1) = stage bottom-right.
 * Bleed: 75 px on each side; trim starts at (75, 75). Trim Line and Safe Zone helpers
 * are derived from this same model.
 */

// ——— Dimension Authority (1650 × 2250 px at 600 DPI) ———
/** Stage / full bleed dimensions. No competing constants. */
export const STAGE_WIDTH = 1650
export const STAGE_HEIGHT = 2250

/** Bleed per side: 0.125 in at 600 DPI. Deterministic. */
export const BLEED_PX = 75

/** Trim = stage minus bleed on all sides. Consistent rounding. */
export const TRIM_WIDTH = STAGE_WIDTH - 2 * BLEED_PX   // 1500
export const TRIM_HEIGHT = STAGE_HEIGHT - 2 * BLEED_PX // 2100

/** Safe zone = trim minus one bleed inset on all sides. */
export const SAFE_ZONE_WIDTH = TRIM_WIDTH - 2 * BLEED_PX   // 1350
export const SAFE_ZONE_HEIGHT = TRIM_HEIGHT - 2 * BLEED_PX // 1950

/** Canonical DIMENSIONS object for consumers. Single source. */
export const DIMENSIONS = {
  TRIM: { width: TRIM_WIDTH, height: TRIM_HEIGHT },
  BLEED: BLEED_PX,
  FULL_BLEED: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
  SAFE_ZONE: { width: SAFE_ZONE_WIDTH, height: SAFE_ZONE_HEIGHT },
} as const

/** Export target = stage (preview and export use same pixel math). */
export const STAGE_EXPORT_WIDTH = STAGE_WIDTH
export const STAGE_EXPORT_HEIGHT = STAGE_HEIGHT

/** Module 5.4 — rounded trim silhouette radius for clone-card clipping. */
export const TRIM_CORNER_RADIUS_PX = 72

/**
 * Modern proxy inner-border mat corner radii (stage px @ 600 DPI).
 * Konva order: top-left, top-right, bottom-right, bottom-left.
 */
export const INNER_BORDER_CORNER_RADIUS_MODERN = [30, 30, 175, 175] as const

/** Pre-Modern inner-border mat — uniform subtle corner soften on all four corners
 * (replaces the modern asymmetric radii).
 */
export const PRE_MODERN_INNER_BORDER_CORNER_RADIUS_PX = 6
/** Spell / Pre-Modern inner-border mat — uniform corner radius on all four corners. */
export const SPELL_PRE_MODERN_INNER_BORDER_CORNER_RADIUS_PX = 30

/** 600 DPI: convert mm to px. Deterministic rounding. */
export const mmToPx = (mm: number) => Math.round((mm / 25.4) * 600)

/** 3D bevel frame constants */
export const BEVEL_OUTER_STROKE = 2
export const BEVEL_WIDTH = 6
export const BEVEL_INSET = BEVEL_OUTER_STROKE + BEVEL_WIDTH

/** Metadata strip — footer typography and placement (inside Safe Zone). Reduced by 20% from 52. */
export const METADATA_FONT_SIZE = Math.round(52 * 0.8)
/** Vertical margin (px) from bottom of safe zone to first metadata baseline. */
export const FOOTER_MARGIN_Y = 12

// ——— UMPS layout adjustments (doc 04, code-verified) ———

/**
 * Group B — generated proxy P/T capsule is drawn 30% smaller, anchored at the
 * canonical `ptBox` slot center. The canonical full-size slot is unchanged (the
 * M15 painted P/T PNG, once wired, still fills the full slot).
 */
export const PROXY_PT_BOX_SCALE_MULTIPLIER = 0.7
/** Group B — generated proxy P/T capsule X nudge, applied only when M15 frame is OFF. */
export const PROXY_PT_BOX_OFFSET_X_PX = 5

/**
 * Group C — M15-ON-only frame adjustments. Dormant until the M15 painted frame
 * (Stage 3 / doc 03) is reproduced; gated by `M15_PAINTED_FRAME_ACTIVE` below so
 * the default proxy look is unchanged. Values are code-verified per doc 04.
 */
export const PROXY_FRAME_INSET_X_PX = 5
export const PROXY_FRAME_OFFSET_Y_PX = 0
/** Outer + Inner Border shift up in lockstep on the M15-ON path. */
export const M15_INNER_OUTER_BORDER_OFFSET_Y_PX = -10
/** Proxy holo oval radii — Hologram Seal slot = bounding rect (120 × 70), centered on stage X. */
export const PROXY_HOLO_RADIUS_X = 60
export const PROXY_HOLO_RADIUS_Y = 35

/**
 * Single internal switch for the M15 painted-frame mode. The user-facing
 * frame-style selector (M15 vs plain Proxy) is intentionally deferred (doc 07),
 * so this stays `false`: the app renders the proxy frame with the UMPS
 * adjustments as its default look. Group-C geometry is wired through the helpers
 * below but only diverges from the proxy default when this is `true`.
 */
export const M15_PAINTED_FRAME_ACTIVE = false

/**
 * Group B helper — display rect for the GENERATED proxy P/T capsule: the canonical
 * `ptBox` slot scaled by `PROXY_PT_BOX_SCALE_MULTIPLIER` about its center, with the
 * X nudge applied when the M15 frame is OFF. `slot` is the full-size slot rect
 * (e.g. `{ x: ptX, y: ptY, width: ptW, height: ptH }`).
 */
export function getProxyPtBoxDisplayRect(
  slot: { x: number; y: number; width: number; height: number },
  m15Active: boolean = M15_PAINTED_FRAME_ACTIVE,
): { x: number; y: number; width: number; height: number; scale: number; centerX: number; centerY: number } {
  const scale = PROXY_PT_BOX_SCALE_MULTIPLIER
  const offsetX = m15Active ? 0 : PROXY_PT_BOX_OFFSET_X_PX
  const width = slot.width * scale
  const height = slot.height * scale
  const centerX = slot.x + slot.width / 2 + offsetX
  const centerY = slot.y + slot.height / 2
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    scale,
    centerX,
    centerY,
  }
}

/**
 * Group C helper — visible trim + inner border rects for the M15-ON path. When the
 * M15 frame is inactive this returns the rects unchanged, so the proxy default look
 * is preserved. When active, the frame is narrowed `PROXY_FRAME_INSET_X_PX` per side
 * and both borders shift by `PROXY_FRAME_OFFSET_Y_PX + M15_INNER_OUTER_BORDER_OFFSET_Y_PX`.
 */
export function getProxyFrameDisplayRects(
  trim: { x: number; y: number; width: number; height: number },
  inner: { x: number; y: number; width: number; height: number },
  m15Active: boolean = M15_PAINTED_FRAME_ACTIVE,
): {
  trim: { x: number; y: number; width: number; height: number }
  inner: { x: number; y: number; width: number; height: number }
} {
  if (!m15Active) return { trim, inner }
  const insetX = PROXY_FRAME_INSET_X_PX
  const offsetY = PROXY_FRAME_OFFSET_Y_PX + M15_INNER_OUTER_BORDER_OFFSET_Y_PX
  return {
    trim: {
      x: trim.x + insetX,
      y: trim.y + offsetY,
      width: trim.width - 2 * insetX,
      height: trim.height,
    },
    inner: {
      x: inner.x + insetX,
      y: inner.y + offsetY,
      width: inner.width - 2 * insetX,
      height: inner.height,
    },
  }
}

/** Layout mm values (canonical for standard card) */
/**
 * Stage-space span for reverse Bezier plates: straight top/bottom runs align to the art / rules column.
 * `boxLeftStage` is the Konva Shape’s `x` (left edge of the full plate box in stage px).
 */
export type ReverseBezierPlateStageSpan = {
  boxLeftStage: number
  artColumnLeftStage: number
  artColumnWidthStage: number
}

/**
 * Maps the art column into coordinates of a nested local rectangle inside the plate shape canvas
 * (same math for fill, bevel ring, and outer stroke passes).
 */
export function reverseBezierPlatePathInLocalRect(
  span: ReverseBezierPlateStageSpan,
  localRectX: number,
  localRectW: number,
): { pathX: number; pathW: number } {
  const stageLeft = span.boxLeftStage + localRectX
  let pathX = span.artColumnLeftStage - stageLeft
  let pathW = span.artColumnWidthStage
  if (pathX < 0) {
    pathW += pathX
    pathX = 0
  }
  pathW = Math.min(pathW, localRectW - pathX)
  if (pathW < 1) {
    return { pathX: 0, pathW: Math.max(1, Math.floor(localRectW)) }
  }
  return { pathX: Math.round(pathX), pathW: Math.round(pathW) }
}

export const LAYOUT_MM = {
  /** Legacy reference mm; horizontal placement uses trim-centered inner (equal L/R margins). */
  innerInsetX: 2,
  innerInsetTop: 2,
  innerW: 59,
  innerH: 74,
  nameW: 57,
  nameH: 6,
  typeW: 57,
  typeH: 6,
  artH: 40,
  rulesH: 25,
  nameTopOffset: 1.75,
  ptWidthRatio: 65.6 / 367,
} as const

/**
 * Pre-Modern: horizontal inset from inner-border left to the name strip left edge.
 * Used as the target top inset (inner-border top → name strip top).
 */
export function getPreModernInnerContentInsetPx(): number {
  const trimX = DIMENSIONS.BLEED
  const trimW = DIMENSIONS.TRIM.width
  const innerW = mmToPx(LAYOUT_MM.innerW)
  const innerX = trimX + Math.round((trimW - innerW) / 2)
  const nameW = mmToPx(LAYOUT_MM.nameW)
  const nameX = innerX + Math.round((innerW - nameW) / 2)
  return nameX - innerX
}

/** Pre-Modern: upward shift for core slots so top inset matches horizontal inset. */
export function getPreModernLayoutVerticalShiftPx(): number {
  const currentTopInset = mmToPx(LAYOUT_MM.nameTopOffset)
  return Math.max(0, currentTopInset - getPreModernInnerContentInsetPx())
}

/** Spell / Pre-Modern — extra layout tuning on top of the shared pre-modern shift. */
export const SPELL_PRE_MODERN_ART_EXTRA_HEIGHT_PX = 100
export const SPELL_PRE_MODERN_RULES_SHIFT_RIGHT_PX = 5
/** Name strip padding above/below the name + mana block (stage px). */
export const SPELL_PRE_MODERN_NAME_STRIP_PADDING_PX = 22
/** Spell parchment / rules block shift up from layout anchor (stage px). */
export const SPELL_PRE_MODERN_SPELL_BOX_SHIFT_UP_PX = 22
/** Nameplate mana pip scale relative to {@link MANA_COST_ICON_SIZE}. */
export const SPELL_PRE_MODERN_MANA_PIP_SCALE = 1.13
/** Rules text top inset inside the rules / parchment box (stage px). */
export const SPELL_PRE_MODERN_RULES_TOP_PADDING_PX = 4
/** Rules text shift up inside the spell parchment box only (stage px); does not move the box or other card elements. */
export const SPELL_PRE_MODERN_RULES_TEXT_SHIFT_UP_PX = 44
/** Type line strip padding above type text / below type text to parchment (stage px). */
export const SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX = 22
export const SPELL_PRE_MODERN_TYPE_LINE_TOP_GAP_PX = SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX
export const SPELL_PRE_MODERN_SPELL_BOX_TOP_GAP_PX = SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX
/** Expansion / set symbol scale (1 = full size). */
export const SPELL_PRE_MODERN_SET_SYMBOL_SCALE = 0.85

// ——— Normalized Geometry (Module 1.3) ———
/** Rectangle in normalized coordinates: 0–1 relative to full-bleed stage (1650×2250). */
export interface NormalizedRect {
  left: number
  top: number
  width: number
  height: number
}

/** Normalized geometry for standard layout. Source of truth for major card regions. */
export interface NormalizedGeometry {
  nameBar: NormalizedRect
  artBox: NormalizedRect
  typeLine: NormalizedRect
  rulesText: NormalizedRect
  ptBox: NormalizedRect
  footer: NormalizedRect
}

/**
 * Rounding rule: Math.round for all normalized→pixel conversions.
 * Keeps preview/export parity and avoids drift.
 */
function toStagePx(normalized: number, isWidth: boolean): number {
  const size = isWidth ? STAGE_WIDTH : STAGE_HEIGHT
  return Math.round(normalized * size)
}

/** Map a normalized rect to stage pixel rectangle (full-bleed space). */
export function normalizedToStagePx(rect: NormalizedRect): { x: number; y: number; width: number; height: number } {
  return {
    x: toStagePx(rect.left, true),
    y: toStagePx(rect.top, false),
    width: toStagePx(rect.width, true),
    height: toStagePx(rect.height, false),
  }
}

/** Trim Line: post-bleed card rectangle in stage pixels. Origin (0,0) is full-bleed top-left; trim starts at (BLEED_PX, BLEED_PX). */
export function getTrimLineRect(): { x: number; y: number; width: number; height: number } {
  return {
    x: DIMENSIONS.BLEED,
    y: DIMENSIONS.BLEED,
    width: DIMENSIONS.TRIM.width,
    height: DIMENSIONS.TRIM.height,
  }
}

/** Safe Zone: inset from trim by one bleed on all sides, in stage pixels. Centered within trim. */
export function getSafeZoneRect(): { x: number; y: number; width: number; height: number } {
  const trim = getTrimLineRect()
  const w = DIMENSIONS.SAFE_ZONE.width
  const h = DIMENSIONS.SAFE_ZONE.height
  return {
    x: trim.x + Math.round((trim.width - w) / 2),
    y: trim.y + Math.round((trim.height - h) / 2),
    width: w,
    height: h,
  }
}

/**
 * Build normalized geometry from current authoritative layout (trim + mm).
 * Normalized space: full-bleed stage. 0,0 = stage top-left; 1,1 = stage bottom-right.
 * Bleed: 75 px on each side; trim starts at (75, 75). Regions are in stage coordinates.
 */
function buildStandardNormalizedGeometry(): NormalizedGeometry {
  const trimX = DIMENSIONS.BLEED
  const trimY = DIMENSIONS.BLEED
  const trimW = DIMENSIONS.TRIM.width
  const trimH = DIMENSIONS.TRIM.height

  const innerInsetTop = mmToPx(LAYOUT_MM.innerInsetTop)
  const innerW = mmToPx(LAYOUT_MM.innerW)
  const innerX = trimX + Math.round((trimW - innerW) / 2)
  const innerY = trimY + innerInsetTop
  const nameW = mmToPx(LAYOUT_MM.nameW)
  const nameH = mmToPx(LAYOUT_MM.nameH)
  const typeW = mmToPx(LAYOUT_MM.typeW)
  const typeH = mmToPx(LAYOUT_MM.typeH)
  const barRadius = Math.round(Math.min(nameH, typeH) * 0.37)
  const artW = typeW - 2 * barRadius + 48
  const artH = mmToPx(LAYOUT_MM.artH)
  const rulesW = typeW - 2 * barRadius + 48
  const rulesH = mmToPx(LAYOUT_MM.rulesH)
  const nameTopOffset = mmToPx(LAYOUT_MM.nameTopOffset)

  const nameX = innerX + Math.round((innerW - nameW) / 2)
  const artX = innerX + Math.round((innerW - artW) / 2)
  const typeX = innerX + Math.round((innerW - typeW) / 2)
  const rulesX = innerX + Math.round((innerW - rulesW) / 2)

  const nameY = innerY + nameTopOffset
  const artY = nameY + nameH
  const typeY = artY + artH
  const rulesY = typeY + typeH

  const ptH = typeH
  const ptW = Math.round(typeW * LAYOUT_MM.ptWidthRatio)
  const ptX = typeX + typeW - ptW
  const ptCenterY = rulesY + rulesH
  const ptY = Math.round(ptCenterY - ptH / 2)

  const bottomInfoPadX = Math.round((15 / 400) * trimW)
  const bottomInfoOffsetB = Math.round((6.2 / 558) * trimH)
  const bottomInfoH = Math.round((24 / 558) * trimH)
  const bottomInfoX = trimX + bottomInfoPadX
  const bottomInfoY = trimY + trimH - bottomInfoOffsetB - bottomInfoH
  const bottomInfoW = trimW - bottomInfoPadX * 2

  return {
    nameBar: {
      left: nameX / STAGE_WIDTH,
      top: nameY / STAGE_HEIGHT,
      width: nameW / STAGE_WIDTH,
      height: nameH / STAGE_HEIGHT,
    },
    artBox: {
      left: artX / STAGE_WIDTH,
      top: artY / STAGE_HEIGHT,
      width: artW / STAGE_WIDTH,
      height: artH / STAGE_HEIGHT,
    },
    typeLine: {
      left: typeX / STAGE_WIDTH,
      top: typeY / STAGE_HEIGHT,
      width: typeW / STAGE_WIDTH,
      height: typeH / STAGE_HEIGHT,
    },
    rulesText: {
      left: rulesX / STAGE_WIDTH,
      top: rulesY / STAGE_HEIGHT,
      width: rulesW / STAGE_WIDTH,
      height: rulesH / STAGE_HEIGHT,
    },
    ptBox: {
      left: ptX / STAGE_WIDTH,
      top: ptY / STAGE_HEIGHT,
      width: ptW / STAGE_WIDTH,
      height: ptH / STAGE_HEIGHT,
    },
    footer: {
      left: bottomInfoX / STAGE_WIDTH,
      top: bottomInfoY / STAGE_HEIGHT,
      width: bottomInfoW / STAGE_WIDTH,
      height: bottomInfoH / STAGE_HEIGHT,
    },
  }
}

/** Authoritative normalized geometry for standard layout. Single source of truth. */
export const STANDARD_NORMALIZED_GEOMETRY: NormalizedGeometry = buildStandardNormalizedGeometry()

/** Standard layout regions — derived from normalized model + DIMENSIONS. */
export function getStandardLayoutGeometry() {
  const trimX = DIMENSIONS.BLEED
  const trimY = DIMENSIONS.BLEED
  const trimW = DIMENSIONS.TRIM.width
  const trimH = DIMENSIONS.TRIM.height

  const bleedX = 0
  const bleedY = 0
  const bleedW = DIMENSIONS.FULL_BLEED.width
  const bleedH = DIMENSIONS.FULL_BLEED.height

  const safeW = DIMENSIONS.SAFE_ZONE.width
  const safeH = DIMENSIONS.SAFE_ZONE.height
  const safeX = trimX + Math.round((trimW - safeW) / 2)
  const safeY = trimY + Math.round((trimH - safeH) / 2)

  const norm = STANDARD_NORMALIZED_GEOMETRY
  const nameBarPx = normalizedToStagePx(norm.nameBar)
  const artPx = normalizedToStagePx(norm.artBox)
  const typePx = normalizedToStagePx(norm.typeLine)
  const rulesPx = normalizedToStagePx(norm.rulesText)
  const ptPx = normalizedToStagePx(norm.ptBox)
  const footerPx = normalizedToStagePx(norm.footer)

  const nameX = nameBarPx.x
  const nameY = nameBarPx.y
  const nameW = nameBarPx.width
  const nameH = nameBarPx.height
  const artX = artPx.x
  const artY = artPx.y
  const artW = artPx.width
  const artH = artPx.height
  const typeX = typePx.x
  const typeY = typePx.y
  const typeW = typePx.width
  const typeH = typePx.height
  const rulesX = rulesPx.x
  const rulesY = rulesPx.y
  const rulesW = rulesPx.width
  const rulesH = rulesPx.height
  const ptX = ptPx.x
  const ptY = ptPx.y
  const ptW = ptPx.width
  const ptH = ptPx.height

  const barRadius = Math.round(Math.min(nameH, typeH) * 0.37)

  const nameInnerX = nameX + BEVEL_INSET
  const nameInnerY = nameY + BEVEL_INSET
  const nameInnerW = nameW - 2 * BEVEL_INSET
  const nameInnerH = nameH - 2 * BEVEL_INSET
  const artInnerX = artX + BEVEL_INSET
  const artInnerY = artY + BEVEL_INSET
  const artInnerW = artW - 2 * BEVEL_INSET
  const artInnerH = artH - 2 * BEVEL_INSET
  const typeInnerX = typeX + BEVEL_INSET
  const typeInnerY = typeY + BEVEL_INSET
  const typeInnerW = typeW - 2 * BEVEL_INSET
  const typeInnerH = typeH - 2 * BEVEL_INSET
  const rulesInnerX = rulesX + BEVEL_INSET
  const rulesInnerY = rulesY + BEVEL_INSET
  const rulesInnerW = rulesW - 2 * BEVEL_INSET
  const rulesInnerH = rulesH - 2 * BEVEL_INSET
  const ptInnerX = ptX + BEVEL_INSET
  const ptInnerY = ptY + BEVEL_INSET
  const ptInnerW = ptW - 2 * BEVEL_INSET
  const ptInnerH = ptH - 2 * BEVEL_INSET

  const bottomInfoX = footerPx.x
  const bottomInfoY = footerPx.y
  const bottomInfoW = footerPx.width
  const bottomInfoH = footerPx.height

  const setIconPad = Math.round((3 / 400) * trimW)
  const setInfoW = Math.round((120 / 400) * trimW)
  const rarityW = Math.round((40 / 400) * trimW)
  const copyrightW = Math.max(0, bottomInfoW - setInfoW - rarityW - Math.round((8 / 400) * trimW) * 2)
  const setInfoX = bottomInfoX
  const copyrightX = setInfoX + setInfoW + Math.round((8 / 400) * trimW)
  const rarityX = bottomInfoX + bottomInfoW - rarityW

  const metadataLineHeight = Math.round(METADATA_FONT_SIZE * 1.08)
  const metadataLeftX = typeX
  const metadataRightX = typeX + typeW
  let metadataLine2Y = Math.min(
    STAGE_HEIGHT - METADATA_FONT_SIZE,
    safeY + safeH - FOOTER_MARGIN_Y - METADATA_FONT_SIZE
  )
  let metadataLine1Y = metadataLine2Y - metadataLineHeight
  metadataLine1Y += metadataLineHeight
  metadataLine2Y += metadataLineHeight
  const rulesBottom = rulesY + rulesH
  if (metadataLine1Y - METADATA_FONT_SIZE < rulesBottom) {
    metadataLine1Y = rulesBottom + METADATA_FONT_SIZE
    metadataLine2Y = metadataLine1Y + metadataLineHeight
  }
  const metadataBaseline1 = metadataLine1Y
  const metadataBaseline2 = metadataLine2Y
  const copyrightY = ptY + ptH + FOOTER_MARGIN_Y + METADATA_FONT_SIZE

  const innerY = trimY + mmToPx(LAYOUT_MM.innerInsetTop)
  const innerW = mmToPx(LAYOUT_MM.innerW)
  const innerX = trimX + Math.round((trimW - innerW) / 2)
  const innerH = Math.max(1, ptY - innerY) + 50

  return {
    trimX,
    trimY,
    trimW,
    trimH,
    bleedX,
    bleedY,
    bleedW,
    bleedH,
    safeX,
    safeY,
    safeW,
    safeH,
    innerX,
    innerY,
    innerW,
    innerH,
    nameX,
    nameY,
    nameW,
    nameH,
    nameInnerX,
    nameInnerY,
    nameInnerW,
    nameInnerH,
    artX,
    artY,
    artW,
    artH,
    artInnerX,
    artInnerY,
    artInnerW,
    artInnerH,
    typeX,
    typeY,
    typeW,
    typeH,
    typeInnerX,
    typeInnerY,
    typeInnerW,
    typeInnerH,
    rulesX,
    rulesY,
    rulesW,
    rulesH,
    rulesInnerX,
    rulesInnerY,
    rulesInnerW,
    rulesInnerH,
    ptX,
    ptY,
    ptW,
    ptH,
    ptInnerX,
    ptInnerY,
    ptInnerW,
    ptInnerH,
    barRadius,
    bottomInfoX,
    bottomInfoY,
    bottomInfoW,
    bottomInfoH,
    setIconPad,
    setInfoW,
    setInfoX,
    rarityW,
    rarityX,
    copyrightW,
    copyrightX,
    metadataLeftX,
    metadataLeftY: metadataBaseline1,
    metadataLine1Y,
    metadataLine2Y,
    metadataRightX,
    metadataRightY: metadataBaseline1,
    metadataBaseline2,
    copyrightY,
    metadataLineHeight,
  }
}

export type StandardLayoutGeometry = ReturnType<typeof getStandardLayoutGeometry>

/** Module 4.3 — one active layout at a time; Standard is canonical. */
export const CARD_LAYOUT_MODES = [
  'Standard',
  'Full Art',
  'Extended Art',
  'Borderless',
  'Land',
  'Class',
  'Saga',
  'Hidden',
] as const

export type CardLayoutMode = (typeof CARD_LAYOUT_MODES)[number]

/** Full-bleed artwork bounds per Roadmap 4.3 addendum (1650 × 2250 stage edge). */
export function layoutUsesFullBleedArt(mode: CardLayoutMode): boolean {
  return mode === 'Full Art' || mode === 'Extended Art' || mode === 'Borderless'
}

/**
 * Art layer clip / fit region for the active layout (stage px).
 * Full Art / Extended Art / Borderless: entire full-bleed stage.
 */
export function getLayoutArtRect(
  mode: CardLayoutMode,
  standard: StandardLayoutGeometry,
): { x: number; y: number; width: number; height: number } {
  if (layoutUsesFullBleedArt(mode)) {
    return { x: 0, y: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT }
  }
  return {
    x: standard.artInnerX,
    y: standard.artInnerY,
    width: standard.artInnerW,
    height: standard.artInnerH,
  }
}

export function normalizeCardLayoutMode(v: unknown): CardLayoutMode {
  if (typeof v === 'string' && (CARD_LAYOUT_MODES as readonly string[]).includes(v)) return v as CardLayoutMode
  return 'Standard'
}

/** Module 5.2 — type-line set symbol slot (matches TextIconsLayer set icon position). */
export function getSetSymbolSlotPx(
  layout: StandardLayoutGeometry,
  iconBoxS: number,
): { x: number; y: number; size: number } {
  const { typeX, typeW, typeY, typeH, setIconPad } = layout
  return {
    x: typeX + typeW - iconBoxS - setIconPad,
    y: typeY + (typeH - iconBoxS) / 2,
    size: iconBoxS,
  }
}

/** Rules box center and max watermark size (Module 5.2). */
export function getRulesWatermarkRegionPx(layout: StandardLayoutGeometry): {
  cx: number
  cy: number
  diameter: number
} {
  const { rulesInnerX, rulesInnerY, rulesInnerW, rulesInnerH } = layout
  return {
    cx: rulesInnerX + rulesInnerW / 2,
    cy: rulesInnerY + rulesInnerH / 2,
    diameter: Math.min(rulesInnerW, rulesInnerH) * 0.84,
  }
}
