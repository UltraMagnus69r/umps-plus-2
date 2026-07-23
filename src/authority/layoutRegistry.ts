import type { CardLayoutMode } from './geometryAuthority'
import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  getPreModernLayoutVerticalShiftPx,
  getStandardLayoutGeometry,
} from './geometryAuthority'
import { buildSpellPreModernStageRects } from './spellPreModernLayoutAuthority'
import { buildModernDummyStageRects } from './modernDummyLayoutAuthority'
import { buildAscendantStageRects } from './ascendantLayoutAuthority'
import { buildTarotStageRects } from './tarotLayoutAuthority'
import { buildPlaneswalkerModernV2StageRects } from './planeswalkerModernV2LayoutAuthority'
import { getPreModernTextBoxInnerRect } from './preModernTextBoxAuthority'
import type { LayoutContract, LayoutFamilyRegionExtensions } from './layoutContract'
import { hasRequiredCoreRegions, normalizeLayoutContract } from './layoutContract'
import type { LayoutRegionRect } from './layoutContract'
import type { LayoutFamily, LayoutId, LayoutVariant } from './layoutTaxonomy'
import {
  layoutCompatibility,
  layoutFromLegacyMode,
  layoutToLegacyMode,
  normalizeLayout,
  isVariantCompatible,
  resolveRequestedLayoutSwitch,
} from './layoutTaxonomy'

function shiftNormalizedRectUp(rect: LayoutRegionRect, shiftPx: number): LayoutRegionRect {
  return { ...rect, top: rect.top - shiftPx / STAGE_HEIGHT }
}

function shiftFamilyExtensionValue(
  value: LayoutRegionRect | readonly LayoutRegionRect[],
  shiftPx: number,
): LayoutRegionRect | readonly LayoutRegionRect[] {
  if (Array.isArray(value)) {
    return value.map((r) => shiftNormalizedRectUp(r, shiftPx))
  }
  const rect = value as LayoutRegionRect
  return shiftNormalizedRectUp(rect, shiftPx)
}

function shiftLayoutContractRegionsUp(contract: LayoutContract, shiftPx: number): LayoutContract {
  if (shiftPx <= 0) return contract
  const { regions, familyExtensions } = contract
  const shiftedExtensions = familyExtensions
    ? (Object.fromEntries(
        Object.entries(familyExtensions).map(([key, value]) => [key, shiftFamilyExtensionValue(value, shiftPx)]),
      ) as LayoutFamilyRegionExtensions)
    : undefined
  return {
    ...contract,
    regions: {
      ...regions,
      nameBar: shiftNormalizedRectUp(regions.nameBar, shiftPx),
      art: shiftNormalizedRectUp(regions.art, shiftPx),
      typeLine: shiftNormalizedRectUp(regions.typeLine, shiftPx),
      rulesText: shiftNormalizedRectUp(regions.rulesText, shiftPx),
      metadataStrip: shiftNormalizedRectUp(regions.metadataStrip, shiftPx),
      lowerRight: regions.lowerRight
        ? { ...regions.lowerRight, rect: shiftNormalizedRectUp(regions.lowerRight.rect, shiftPx) }
        : undefined,
    },
    familyExtensions: shiftedExtensions,
  }
}

/** Pre-Modern layouts hide name/type plates and hologram; text and symbols still render. */
function buildPreModernContractFromModern(modern: LayoutContract, family: LayoutId['family']): LayoutContract {
  const withFlags = normalizeLayoutContract({
    ...modern,
    id: { family, variant: 'pre-modern' },
    capabilities: {
      ...modern.capabilities,
      supportsNamePlateBox: false,
      supportsTypeLineBox: false,
      supportsHologramSeal: false,
      supportsPowerToughnessBox: false,
      supportsPreModernFooterLayout: true,
    },
  })
  return shiftLayoutContractRegionsUp(withFlags, getPreModernLayoutVerticalShiftPx())
}

type PreModernSpellStyleOptions = {
  /** Standard / Pre-Modern uses the raised P/T box instead of inline footer P/T text. */
  supportsPowerToughnessBox?: boolean
}

/** Spell / Pre-Modern — parchment panel + shared pre-modern face geometry. */
function buildPreModernSpellStyleContract(
  family: LayoutId['family'],
  modern: LayoutContract,
): LayoutContract {
  const base = buildPreModernContractFromModern(modern, family)
  const rects = buildSpellPreModernStageRects()
  return normalizeLayoutContract({
    ...base,
    familyExtensions: undefined,
    regions: {
      ...base.regions,
      nameBar: pxRectToNormalizedRect(rects.nameBar),
      art: pxRectToNormalizedRect(rects.art),
      typeLine: pxRectToNormalizedRect(rects.typeLine),
      rulesText: pxRectToNormalizedRect(rects.rulesText),
    },
    capabilities: {
      ...base.capabilities,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: false,
      supportsSpellTextBoxPanel: true,
      supportsPreModernFaceLayout: true,
      supportsPreModernTextBoxFrame: false,
      supportsPreModernInlinePowerToughness: false,
      supportsLandSecondaryArtInRulesRegion: false,
    },
  })
}

/** Standard / Land Pre-Modern — shared face geometry + fixed art-style rules text box. */
function buildStandardLandPreModernContract(
  family: 'standard' | 'land',
  modern: LayoutContract,
  options: PreModernSpellStyleOptions = {},
): LayoutContract {
  const base = buildPreModernContractFromModern(modern, family)
  const faceRects = buildSpellPreModernStageRects()
  const textInner = getPreModernTextBoxInnerRect()
  const enablePtBox = options.supportsPowerToughnessBox === true
  const lowerRight =
    enablePtBox && modern.regions.lowerRight?.kind === 'powerToughness'
      ? modern.regions.lowerRight
      : base.regions.lowerRight
  return normalizeLayoutContract({
    ...base,
    familyExtensions: undefined,
    regions: {
      ...base.regions,
      nameBar: pxRectToNormalizedRect(faceRects.nameBar),
      art: pxRectToNormalizedRect(faceRects.art),
      typeLine: pxRectToNormalizedRect(faceRects.typeLine),
      rulesText: pxRectToNormalizedRect(textInner),
      lowerRight,
    },
    capabilities: {
      ...base.capabilities,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: true,
      supportsSpellTextBoxPanel: false,
      supportsPreModernFaceLayout: true,
      supportsPreModernTextBoxFrame: true,
      supportsPreModernInlinePowerToughness: family === 'land' ? false : !enablePtBox,
      supportsLandSecondaryArtInRulesRegion: false,
      supportsPowerToughnessBox: family === 'land' ? false : enablePtBox,
    },
  })
}

export function serializeLayoutId(layout: LayoutId): string {
  const normalized = normalizeLayout(layout)
  return `${normalized.family}::${normalized.variant}`
}

type RuntimeLayoutInput = {
  currentLayout?: CardLayoutMode
  cardData?: {
    layout?: Partial<LayoutId> | null
  } | null
}

export function deserializeLayoutId(key: string): LayoutId | null {
  if (typeof key !== 'string' || !key.includes('::')) return null
  const [family, variant] = key.split('::')
  const normalized = normalizeLayout({
    family: family as LayoutFamily,
    variant: variant as LayoutVariant,
  })
  if (!isVariantCompatible(normalized.family, normalized.variant)) return null
  return normalized
}

function pxRectToNormalizedRect(rect: { x: number; y: number; width: number; height: number }) {
  return {
    left: rect.x / STAGE_WIDTH,
    top: rect.y / STAGE_HEIGHT,
    width: rect.width / STAGE_WIDTH,
    height: rect.height / STAGE_HEIGHT,
  }
}

function normalizedToStageRect(rect: { left: number; top: number; width: number; height: number }) {
  return {
    x: Math.round(rect.left * STAGE_WIDTH),
    y: Math.round(rect.top * STAGE_HEIGHT),
    width: Math.round(rect.width * STAGE_WIDTH),
    height: Math.round(rect.height * STAGE_HEIGHT),
  }
}

export function layoutRegionToStageRect(rect: { left: number; top: number; width: number; height: number }) {
  return normalizedToStageRect(rect)
}

function extensionValueToStageRect(value: LayoutFamilyRegionExtensions[string]) {
  if (value && typeof value === 'object' && 'left' in value) {
    return normalizedToStageRect(value)
  }
  return (value as readonly { left: number; top: number; width: number; height: number }[]).map((r) =>
    normalizedToStageRect(r),
  )
}

function buildStandardClassicModernTemplate(): LayoutContract {
  const standard = getStandardLayoutGeometry()
  return normalizeLayoutContract({
    id: { family: 'standard', variant: 'modern' },
    regions: {
      art: pxRectToNormalizedRect({
        x: standard.artInnerX,
        y: standard.artInnerY,
        width: standard.artInnerW,
        height: standard.artInnerH,
      }),
      nameBar: pxRectToNormalizedRect({
        x: standard.nameInnerX,
        y: standard.nameInnerY,
        width: standard.nameInnerW,
        height: standard.nameInnerH,
      }),
      typeLine: pxRectToNormalizedRect({
        x: standard.typeInnerX,
        y: standard.typeInnerY,
        width: standard.typeInnerW,
        height: standard.typeInnerH,
      }),
      rulesText: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY,
        width: standard.rulesInnerW,
        height: standard.rulesInnerH,
      }),
      metadataStrip: pxRectToNormalizedRect({
        x: standard.bottomInfoX,
        y: standard.bottomInfoY,
        width: standard.bottomInfoW,
        height: standard.bottomInfoH,
      }),
      lowerRight: {
        kind: 'powerToughness',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      supportsFlavorText: true,
      supportsPowerToughnessBox: true,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: false,
    },
    bleedBehavior: 'trim-contained',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
  })
}

/** Standard / Modern — pre-modern art/rules column + modern plates, metadata, and P/T box. */
function buildStandardModernContract(): LayoutContract {
  const template = buildStandardClassicModernTemplate()
  const rects = buildModernDummyStageRects()
  return normalizeLayoutContract({
    ...template,
    id: { family: 'standard', variant: 'modern' },
    familyExtensions: undefined,
    regions: {
      ...template.regions,
      nameBar: pxRectToNormalizedRect(rects.nameBar),
      art: pxRectToNormalizedRect(rects.art),
      typeLine: pxRectToNormalizedRect(rects.typeLine),
      rulesText: pxRectToNormalizedRect(rects.rulesText),
      lowerRight: {
        kind: 'powerToughness',
        rect: pxRectToNormalizedRect(rects.lowerRight),
      },
    },
    capabilities: {
      ...template.capabilities,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: true,
      supportsSpellTextBoxPanel: false,
      supportsPreModernFaceLayout: false,
      supportsPreModernTextBoxFrame: true,
      supportsPreModernFooterLayout: false,
      supportsPreModernInlinePowerToughness: false,
      supportsModernDummyLayout: true,
      supportsPowerToughnessBox: true,
      supportsNamePlateBox: true,
      supportsTypeLineBox: true,
      supportsHologramSeal: true,
      supportsMetadataStrip: true,
    },
  })
}

/** Standard / Borderless — Standard / Modern chrome with full-bleed art (no inner border). */
function buildStandardBorderlessContract(): LayoutContract {
  const modern = buildStandardModernContract()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'standard', variant: 'borderless' },
    regions: {
      ...modern.regions,
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
    },
    capabilities: {
      ...modern.capabilities,
      supportsEdgeToBleedArt: true,
    },
    bleedBehavior: 'edge-to-bleed',
  })
}

/** Standard / Pre-Modern — pre-modern face + fixed rules text box; inline P/T only (no P/T box). */
function buildStandardPreModernContract(): LayoutContract {
  return buildStandardLandPreModernContract('standard', buildStandardClassicModernTemplate())
}

function buildStandardFullArtContract(): LayoutContract {
  const modern = buildStandardModernContract()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'standard', variant: 'full-art' },
    regions: {
      ...modern.regions,
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
    },
    capabilities: {
      ...modern.capabilities,
      supportsEdgeToBleedArt: true,
      supportsFloatingTextTreatment: true,
      supportsNamePlateBox: false,
      supportsTypeLineBox: false,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: false,
      supportsPreModernTextBoxFrame: false,
    },
    bleedBehavior: 'edge-to-bleed',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
  })
}

function buildClassicModernTemplate(): LayoutContract {
  const standard = getStandardLayoutGeometry()
  return normalizeLayoutContract({
    id: { family: 'land', variant: 'modern' },
    regions: {
      art: pxRectToNormalizedRect({
        x: standard.artInnerX,
        y: standard.artInnerY,
        width: standard.artInnerW,
        height: standard.artInnerH,
      }),
      nameBar: pxRectToNormalizedRect({
        x: standard.nameInnerX,
        y: standard.nameInnerY,
        width: standard.nameInnerW,
        height: standard.nameInnerH,
      }),
      typeLine: pxRectToNormalizedRect({
        x: standard.typeInnerX,
        y: standard.typeInnerY,
        width: standard.typeInnerW,
        height: standard.typeInnerH,
      }),
      rulesText: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY,
        width: standard.rulesInnerW,
        height: standard.rulesInnerH,
      }),
      metadataStrip: pxRectToNormalizedRect({
        x: standard.bottomInfoX,
        y: standard.bottomInfoY,
        width: standard.bottomInfoW,
        height: standard.bottomInfoH,
      }),
      lowerRight: {
        kind: 'powerToughness',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      supportsFlavorText: true,
      supportsPowerToughnessBox: true,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: false,
    },
    bleedBehavior: 'trim-contained',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
  })
}

/** Land / Modern — pre-modern art/rules column + modern plates and metadata (no P/T). */
function buildLandModernContract(): LayoutContract {
  const template = buildClassicModernTemplate()
  const rects = buildModernDummyStageRects()
  const standard = getStandardLayoutGeometry()
  return normalizeLayoutContract({
    ...template,
    id: { family: 'land', variant: 'modern' },
    familyExtensions: undefined,
    regions: {
      ...template.regions,
      nameBar: pxRectToNormalizedRect(rects.nameBar),
      art: pxRectToNormalizedRect(rects.art),
      typeLine: pxRectToNormalizedRect(rects.typeLine),
      rulesText: pxRectToNormalizedRect(rects.rulesText),
      lowerRight: {
        kind: 'functionalZone',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      ...template.capabilities,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: true,
      supportsSpellTextBoxPanel: false,
      supportsPreModernFaceLayout: false,
      supportsPreModernTextBoxFrame: true,
      supportsPreModernFooterLayout: false,
      supportsPreModernInlinePowerToughness: false,
      supportsModernDummyLayout: true,
      supportsPowerToughnessBox: false,
      supportsNamePlateBox: true,
      supportsTypeLineBox: true,
      supportsHologramSeal: true,
      supportsMetadataStrip: true,
    },
  })
}

/** Land / Borderless — Land / Modern chrome with full-bleed art (no inner border). */
function buildLandBorderlessContract(): LayoutContract {
  const modern = buildLandModernContract()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'land', variant: 'borderless' },
    regions: {
      ...modern.regions,
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
    },
    capabilities: {
      ...modern.capabilities,
      supportsEdgeToBleedArt: true,
    },
    bleedBehavior: 'edge-to-bleed',
  })
}

/** Land / Pre-Modern — pre-modern face + fixed rules text box (no P/T). */
function buildLandPreModernContractFromTemplate(modern: LayoutContract): LayoutContract {
  return buildStandardLandPreModernContract('land', modern)
}

function buildLandPreModernContract(): LayoutContract {
  return buildLandPreModernContractFromTemplate(buildClassicModernTemplate())
}

/** Planeswalker / Modern — Standard / Modern geometry; starting loyalty + ability rows. */
function buildPlaneswalkerModernContract(): LayoutContract {
  const modern = buildStandardModernContract()
  const standard = getStandardLayoutGeometry()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'planeswalker', variant: 'modern' },
    regions: {
      ...modern.regions,
      lowerRight: {
        kind: 'functionalZone',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      ...modern.capabilities,
      supportsPowerToughnessBox: false,
      supportsStartingLoyaltyBox: true,
      supportsPlaneswalkerAbilities: true,
      supportsFlavorText: true,
    },
  })
}

/** Planeswalker / Modern V2 — bowed art, right-offset narrower rules box, badge gutter. */
function buildPlaneswalkerModernV2Contract(): LayoutContract {
  const modern = buildPlaneswalkerModernContract()
  const rects = buildPlaneswalkerModernV2StageRects()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'planeswalker', variant: 'modern-v2' },
    familyExtensions: undefined,
    regions: {
      ...modern.regions,
      nameBar: pxRectToNormalizedRect(rects.nameBar),
      art: pxRectToNormalizedRect(rects.art),
      typeLine: pxRectToNormalizedRect(rects.typeLine),
      rulesText: pxRectToNormalizedRect(rects.rulesText),
      lowerRight: {
        kind: 'functionalZone',
        rect: pxRectToNormalizedRect(rects.lowerRight),
      },
    },
    capabilities: {
      ...modern.capabilities,
      supportsPlaneswalkerModernV2Layout: true,
      supportsModernDummyLayout: false,
      supportsPreModernTextBoxFrame: false,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: true,
    },
  })
}

/** Planeswalker / Borderless — Modern chrome with full-bleed art; starting loyalty + ability rows. */
function buildPlaneswalkerBorderlessContract(): LayoutContract {
  const modern = buildPlaneswalkerModernContract()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'planeswalker', variant: 'borderless' },
    regions: {
      ...modern.regions,
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
    },
    capabilities: {
      ...modern.capabilities,
      supportsEdgeToBleedArt: true,
    },
    bleedBehavior: 'edge-to-bleed',
  })
}

/** Planeswalker / Full Art — full-bleed art, floating text; starting loyalty + ability rows. */
function buildPlaneswalkerFullArtContract(): LayoutContract {
  const modern = buildPlaneswalkerModernContract()
  return normalizeLayoutContract({
    ...modern,
    id: { family: 'planeswalker', variant: 'full-art' },
    regions: {
      ...modern.regions,
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
    },
    capabilities: {
      ...modern.capabilities,
      supportsEdgeToBleedArt: true,
      supportsFloatingTextTreatment: true,
      supportsNamePlateBox: false,
      supportsTypeLineBox: false,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: false,
      supportsPreModernTextBoxFrame: false,
      supportsPowerToughnessBox: false,
      supportsStartingLoyaltyBox: true,
      supportsPlaneswalkerAbilities: true,
      supportsFlavorText: true,
    },
    bleedBehavior: 'edge-to-bleed',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
  })
}

/** Planeswalker / Pre-Modern — old-border face + recessed rules box; loyalty shield + ability rows. */
function buildPlaneswalkerPreModernContract(): LayoutContract {
  const base = buildPreModernContractFromModern(buildPlaneswalkerModernContract(), 'planeswalker')
  const faceRects = buildSpellPreModernStageRects()
  const textInner = getPreModernTextBoxInnerRect()
  return normalizeLayoutContract({
    ...base,
    familyExtensions: undefined,
    regions: {
      ...base.regions,
      nameBar: pxRectToNormalizedRect(faceRects.nameBar),
      art: pxRectToNormalizedRect(faceRects.art),
      typeLine: pxRectToNormalizedRect(faceRects.typeLine),
      rulesText: pxRectToNormalizedRect(textInner),
    },
    capabilities: {
      ...base.capabilities,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: true,
      supportsSpellTextBoxPanel: false,
      supportsPreModernFaceLayout: true,
      supportsPreModernTextBoxFrame: true,
      supportsPreModernInlinePowerToughness: false,
      supportsModernDummyLayout: false,
      supportsPowerToughnessBox: false,
      supportsStartingLoyaltyBox: true,
      supportsPlaneswalkerAbilities: true,
      supportsFlavorText: true,
    },
  })
}

/** Land / Full Art — full-bleed art, mana circle, name plate; rules text suppressed on card. */
function buildLandFullArtContract(): LayoutContract {
  const modern = buildLandModernContract()
  const floatingFullArtBase = normalizeLayoutContract({
    ...modern,
    id: { family: 'land', variant: 'full-art' },
    regions: {
      ...modern.regions,
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
    },
    capabilities: {
      ...modern.capabilities,
      supportsEdgeToBleedArt: true,
      supportsFloatingTextTreatment: true,
      supportsNamePlateBox: false,
      supportsTypeLineBox: false,
      supportsRulesTextBoxFrame: false,
      supportsRulesTextBoxTexture: false,
      supportsPreModernTextBoxFrame: false,
    },
    bleedBehavior: 'edge-to-bleed',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
  })
  const lr = floatingFullArtBase.regions.lowerRight
  const geom = getStandardLayoutGeometry()
  const rulesBottom = geom.rulesInnerY + geom.rulesInnerH
  const nameTop = rulesBottom - geom.nameInnerH
  return normalizeLayoutContract({
    ...floatingFullArtBase,
    id: { family: 'land', variant: 'full-art' },
    regions: {
      art: pxRectToNormalizedRect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      }),
      nameBar: pxRectToNormalizedRect({
        x: geom.nameInnerX,
        y: nameTop,
        width: geom.nameInnerW,
        height: geom.nameInnerH,
      }),
      typeLine: pxRectToNormalizedRect({
        x: geom.typeInnerX,
        y: geom.typeInnerY,
        width: geom.typeInnerW,
        height: geom.typeInnerH,
      }),
      rulesText: pxRectToNormalizedRect({
        x: geom.rulesInnerX,
        y: geom.rulesInnerY,
        width: geom.rulesInnerW,
        height: geom.rulesInnerH,
      }),
      metadataStrip: pxRectToNormalizedRect({
        x: geom.bottomInfoX,
        y: geom.bottomInfoY,
        width: geom.bottomInfoW,
        height: geom.bottomInfoH,
      }),
      lowerRight:
        lr != null
          ? { kind: 'functionalZone', rect: lr.rect }
          : undefined,
    },
    capabilities: {
      ...floatingFullArtBase.capabilities,
      supportsFloatingTextTreatment: false,
      supportsModernDummyLayout: false,
      supportsNamePlateBox: true,
      supportsTypeLineBox: false,
      supportsRulesTextBoxFrame: false,
      supportsPowerToughnessBox: false,
      supportsLandSecondaryArtInRulesRegion: false,
      supportsRulesTextBoxTexture: false,
      supportsPreModernTextBoxFrame: false,
      suppressNameBarManaCostRendering: true,
      useLandFullArtManaCircle: true,
      suppressRulesTextRendering: true,
    },
  })
}

function buildSpellStandardContract(): LayoutContract {
  const standard = getStandardLayoutGeometry()
  return normalizeLayoutContract({
    id: { family: 'spell', variant: 'modern' },
    regions: {
      art: pxRectToNormalizedRect({
        x: standard.artInnerX,
        y: standard.artInnerY,
        width: standard.artInnerW,
        height: standard.artInnerH,
      }),
      nameBar: pxRectToNormalizedRect({
        x: standard.nameInnerX,
        y: standard.nameInnerY,
        width: standard.nameInnerW,
        height: standard.nameInnerH,
      }),
      typeLine: pxRectToNormalizedRect({
        x: standard.typeInnerX,
        y: standard.typeInnerY,
        width: standard.typeInnerW,
        height: standard.typeInnerH,
      }),
      rulesText: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY,
        width: standard.rulesInnerW,
        height: standard.rulesInnerH,
      }),
      metadataStrip: pxRectToNormalizedRect({
        x: standard.bottomInfoX,
        y: standard.bottomInfoY,
        width: standard.bottomInfoW,
        height: standard.bottomInfoH,
      }),
      lowerRight: {
        kind: 'functionalZone',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      supportsFlavorText: true,
      supportsPowerToughnessBox: false,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: false,
    },
    bleedBehavior: 'trim-contained',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
  })
}

/** Pre-Modern spell — parchment panel replaces rules-text box frame. */
function buildSpellPreModernContract(): LayoutContract {
  return buildPreModernSpellStyleContract('spell', buildSpellStandardContract())
}

function buildSagaStandardContract(): LayoutContract {
  const standard = getStandardLayoutGeometry()
  const chapterHeight = Math.round(standard.rulesInnerH / 3)
  const chapterExtensions: LayoutFamilyRegionExtensions = {
    chapterRow1: pxRectToNormalizedRect({
      x: standard.rulesInnerX,
      y: standard.rulesInnerY,
      width: standard.rulesInnerW,
      height: chapterHeight,
    }),
    chapterRow2: pxRectToNormalizedRect({
      x: standard.rulesInnerX,
      y: standard.rulesInnerY + chapterHeight,
      width: standard.rulesInnerW,
      height: chapterHeight,
    }),
    chapterRow3: pxRectToNormalizedRect({
      x: standard.rulesInnerX,
      y: standard.rulesInnerY + chapterHeight * 2,
      width: standard.rulesInnerW,
      height: standard.rulesInnerH - chapterHeight * 2,
    }),
  }
  return normalizeLayoutContract({
    id: { family: 'spell', variant: 'saga' },
    regions: {
      art: pxRectToNormalizedRect({
        x: standard.artInnerX,
        y: standard.artInnerY,
        width: standard.artInnerW,
        height: standard.artInnerH,
      }),
      nameBar: pxRectToNormalizedRect({
        x: standard.nameInnerX,
        y: standard.nameInnerY,
        width: standard.nameInnerW,
        height: standard.nameInnerH,
      }),
      typeLine: pxRectToNormalizedRect({
        x: standard.typeInnerX,
        y: standard.typeInnerY,
        width: standard.typeInnerW,
        height: standard.typeInnerH,
      }),
      rulesText: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY,
        width: standard.rulesInnerW,
        height: standard.rulesInnerH,
      }),
      metadataStrip: pxRectToNormalizedRect({
        x: standard.bottomInfoX,
        y: standard.bottomInfoY,
        width: standard.bottomInfoW,
        height: standard.bottomInfoH,
      }),
      lowerRight: {
        kind: 'functionalZone',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      supportsFlavorText: false,
      supportsPowerToughnessBox: false,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: true,
    },
    bleedBehavior: 'trim-contained',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
    familyExtensions: chapterExtensions,
  })
}

function buildClassStandardContract(): LayoutContract {
  const standard = getStandardLayoutGeometry()
  const levelHeight = Math.round(standard.rulesInnerH / 3)
  return normalizeLayoutContract({
    id: { family: 'spell', variant: 'class' },
    regions: {
      art: pxRectToNormalizedRect({
        x: standard.artInnerX,
        y: standard.artInnerY,
        width: standard.artInnerW,
        height: standard.artInnerH,
      }),
      nameBar: pxRectToNormalizedRect({
        x: standard.nameInnerX,
        y: standard.nameInnerY,
        width: standard.nameInnerW,
        height: standard.nameInnerH,
      }),
      typeLine: pxRectToNormalizedRect({
        x: standard.typeInnerX,
        y: standard.typeInnerY,
        width: standard.typeInnerW,
        height: standard.typeInnerH,
      }),
      rulesText: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY,
        width: standard.rulesInnerW,
        height: standard.rulesInnerH,
      }),
      metadataStrip: pxRectToNormalizedRect({
        x: standard.bottomInfoX,
        y: standard.bottomInfoY,
        width: standard.bottomInfoW,
        height: standard.bottomInfoH,
      }),
      lowerRight: {
        kind: 'functionalZone',
        rect: pxRectToNormalizedRect({
          x: standard.ptInnerX,
          y: standard.ptInnerY,
          width: standard.ptInnerW,
          height: standard.ptInnerH,
        }),
      },
    },
    capabilities: {
      supportsFlavorText: false,
      supportsPowerToughnessBox: false,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: true,
    },
    bleedBehavior: 'trim-contained',
    compliance: {
      requiresTrimCompliance: true,
      requiresSafeZoneCompliance: true,
    },
    familyExtensions: {
      levelBand1: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY,
        width: standard.rulesInnerW,
        height: levelHeight,
      }),
      levelBand2: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY + levelHeight,
        width: standard.rulesInnerW,
        height: levelHeight,
      }),
      levelBand3: pxRectToNormalizedRect({
        x: standard.rulesInnerX,
        y: standard.rulesInnerY + levelHeight * 2,
        width: standard.rulesInnerW,
        height: standard.rulesInnerH - levelHeight * 2,
      }),
    },
  })
}

/** Special / Ascendant — blueprint geometry (floating mana column, flavor ribbon, bottom type line). */
function buildSpecialAscendantContract(): LayoutContract {
  const rects = buildAscendantStageRects()
  return normalizeLayoutContract({
    id: { family: 'special', variant: 'ascendant' },
    familyExtensions: {
      flavorText: pxRectToNormalizedRect(rects.flavorText),
      expansionSymbol: pxRectToNormalizedRect(rects.expansionSymbol),
      hologram: pxRectToNormalizedRect(rects.hologram),
      manaColumn: pxRectToNormalizedRect(rects.manaColumn),
    },
    regions: {
      nameBar: pxRectToNormalizedRect(rects.nameBar),
      art: pxRectToNormalizedRect(rects.art),
      typeLine: pxRectToNormalizedRect(rects.typeLine),
      rulesText: pxRectToNormalizedRect(rects.rulesText),
      metadataStrip: pxRectToNormalizedRect(rects.metadataStrip),
      lowerRight: {
        kind: 'powerToughness',
        rect: pxRectToNormalizedRect(rects.lowerRight),
      },
    },
    capabilities: {
      supportsFlavorText: true,
      supportsPowerToughnessBox: true,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: true,
      supportsLandSecondaryArtInRulesRegion: false,
      supportsRulesTextBoxTexture: false,
      suppressNameBarManaCostRendering: true,
      useLandFullArtManaCircle: false,
      suppressRulesTextRendering: false,
      supportsNamePlateBox: false,
      supportsTypeLineBox: false,
      supportsHologramSeal: true,
      supportsPreModernFooterLayout: false,
      supportsRulesTextBoxFrame: false,
      supportsSpellTextBoxPanel: false,
      supportsPreModernFaceLayout: false,
      supportsPreModernTextBoxFrame: false,
      supportsPreModernInlinePowerToughness: false,
      supportsModernDummyLayout: false,
      supportsStartingLoyaltyBox: false,
      supportsPlaneswalkerAbilities: false,
      supportsPlaneswalkerModernV2Layout: false,
      useAscendantLayout: true,
      useAscendantManaColumn: true,
    },
    bleedBehavior: 'trim-contained',
  })
}

/** Special / Tarot — blueprint geometry (arched art, upper-right mana sockets, engraved plates). */
function buildSpecialTarotContract(): LayoutContract {
  const rects = buildTarotStageRects()
  return normalizeLayoutContract({
    id: { family: 'special', variant: 'tarot' },
    familyExtensions: {
      flavorText: pxRectToNormalizedRect(rects.flavorText),
      expansionSymbol: pxRectToNormalizedRect(rects.expansionSymbol),
      hologram: pxRectToNormalizedRect(rects.hologram),
    },
    regions: {
      nameBar: pxRectToNormalizedRect(rects.nameBar),
      art: pxRectToNormalizedRect(rects.art),
      typeLine: pxRectToNormalizedRect(rects.typeLine),
      rulesText: pxRectToNormalizedRect(rects.rulesText),
      metadataStrip: pxRectToNormalizedRect(rects.metadataStrip),
      lowerRight: {
        kind: 'powerToughness',
        rect: pxRectToNormalizedRect(rects.lowerRight),
      },
    },
    capabilities: {
      supportsFlavorText: true,
      supportsPowerToughnessBox: true,
      supportsMetadataStrip: true,
      supportsEdgeToBleedArt: false,
      supportsFloatingTextTreatment: false,
      supportsSecondaryStructuralRegions: true,
      supportsLandSecondaryArtInRulesRegion: false,
      supportsRulesTextBoxTexture: false,
      suppressNameBarManaCostRendering: true,
      useLandFullArtManaCircle: false,
      suppressRulesTextRendering: false,
      supportsNamePlateBox: false,
      supportsTypeLineBox: false,
      supportsHologramSeal: true,
      supportsPreModernFooterLayout: false,
      supportsRulesTextBoxFrame: false,
      supportsSpellTextBoxPanel: false,
      supportsPreModernFaceLayout: false,
      supportsPreModernTextBoxFrame: false,
      supportsPreModernInlinePowerToughness: false,
      supportsModernDummyLayout: false,
      supportsStartingLoyaltyBox: false,
      supportsPlaneswalkerAbilities: false,
      supportsPlaneswalkerModernV2Layout: false,
      useAscendantLayout: false,
      useAscendantManaColumn: false,
      useTarotLayout: true,
      useTarotManaColumn: true,
    },
    bleedBehavior: 'trim-contained',
  })
}

const rawContracts: readonly LayoutContract[] = [
  buildStandardModernContract(),
  buildStandardBorderlessContract(),
  buildStandardPreModernContract(),
  buildStandardFullArtContract(),
  buildPlaneswalkerModernContract(),
  buildPlaneswalkerModernV2Contract(),
  buildPlaneswalkerBorderlessContract(),
  buildPlaneswalkerFullArtContract(),
  buildPlaneswalkerPreModernContract(),
  buildLandModernContract(),
  buildLandPreModernContract(),
  buildLandBorderlessContract(),
  buildLandFullArtContract(),
  buildSpellStandardContract(),
  buildSpellPreModernContract(),
  buildSagaStandardContract(),
  buildClassStandardContract(),
  buildSpecialAscendantContract(),
  buildSpecialTarotContract(),
]

const registry = new Map<string, LayoutContract>()

for (const contract of rawContracts) {
  if (!hasRequiredCoreRegions(contract.regions)) {
    throw new Error(`Layout registry error (${serializeLayoutId(contract.id)}): missing required core regions`)
  }
  if (!isVariantCompatible(contract.id.family, contract.id.variant)) {
    throw new Error(`Layout registry error (${serializeLayoutId(contract.id)}): incompatible family/variant`)
  }
  const key = serializeLayoutId(contract.id)
  if (registry.has(key)) {
    throw new Error(`Layout registry error (${key}): duplicate contract key`)
  }
  registry.set(key, contract)
}

export function normalizeLayoutForRegistry(layout: Partial<LayoutId> | null | undefined): LayoutId {
  return normalizeLayout(layout)
}

export function normalizeRequestedLayoutSwitch(
  current: Partial<LayoutId> | null | undefined,
  requested: Partial<LayoutId> | null | undefined,
): LayoutId {
  return resolveRequestedLayoutSwitch(current, requested)
}

export function getActiveLayoutIdFromState(input: RuntimeLayoutInput): LayoutId {
  const fromTaxonomy = normalizeLayout(input?.cardData?.layout ?? null)
  if (hasLayoutContract(fromTaxonomy)) return fromTaxonomy
  return normalizeLayout({ family: 'standard', variant: 'modern' })
}

export function getActiveLayoutContractFromState(input: RuntimeLayoutInput): LayoutContract {
  return getLayoutContract(getActiveLayoutIdFromState(input))
}

export function getActiveLayoutRegionsFromState(input: RuntimeLayoutInput): LayoutContract['regions'] {
  return getActiveLayoutContractFromState(input).regions
}

export function getActiveLayoutCapabilitiesFromState(input: RuntimeLayoutInput): LayoutContract['capabilities'] {
  return getActiveLayoutContractFromState(input).capabilities
}

export function getActiveLayoutFamilyExtensionsFromState(
  input: RuntimeLayoutInput,
): LayoutContract['familyExtensions'] {
  return getActiveLayoutContractFromState(input).familyExtensions
}

export function hasLayoutContract(layout: LayoutId): boolean {
  return registry.has(serializeLayoutId(layout))
}

export function getLayoutContract(layout: LayoutId): LayoutContract {
  const key = serializeLayoutId(layout)
  const contract = registry.get(key)
  if (contract) return contract
  const standardFallback = registry.get(serializeLayoutId({ family: 'standard', variant: 'modern' }))
  if (standardFallback) return standardFallback
  throw new Error(`Unknown layout contract and missing standard fallback: ${key}`)
}

export function getAllLayoutContracts(): readonly LayoutContract[] {
  return Array.from(registry.values())
}

export function getLayoutCompatibilityForFamily(family: LayoutFamily): readonly LayoutVariant[] {
  return layoutCompatibility[family]
}

export function getStandardLayoutContract(): LayoutContract {
  return getLayoutContract({ family: 'standard', variant: 'modern' })
}

export function getStandardArtRegion(): LayoutContract['regions']['art'] {
  return getStandardLayoutContract().regions.art
}

export function getStandardMetadataRegion(): LayoutContract['regions']['metadataStrip'] {
  return getStandardLayoutContract().regions.metadataStrip
}

export function getLayoutArtRegion(layout: LayoutId): LayoutContract['regions']['art'] {
  return getLayoutContract(layout).regions.art
}

export function getLayoutMetadataRegion(layout: LayoutId): LayoutContract['regions']['metadataStrip'] {
  return getLayoutContract(layout).regions.metadataStrip
}

export function getLayoutLowerRightRegion(layout: LayoutId): LayoutContract['regions']['lowerRight'] {
  return getLayoutContract(layout).regions.lowerRight
}

export function getLayoutFamilyExtensions(layout: LayoutId): LayoutContract['familyExtensions'] {
  return getLayoutContract(layout).familyExtensions
}

export function getLayoutFamilyExtensionStageRects(layout: LayoutId): Record<string, ReturnType<typeof extensionValueToStageRect>> {
  const ext = getLayoutFamilyExtensions(layout)
  if (!ext) return {}
  const out: Record<string, ReturnType<typeof extensionValueToStageRect>> = {}
  for (const [key, value] of Object.entries(ext)) {
    out[key] = extensionValueToStageRect(value)
  }
  return out
}

export function getActiveLayoutArtRectFromState(input: RuntimeLayoutInput): {
  x: number
  y: number
  width: number
  height: number
} {
  return normalizedToStageRect(getActiveLayoutRegionsFromState(input).art)
}

export function getLegacyLayoutArtRect(layoutMode: CardLayoutMode): {
  x: number
  y: number
  width: number
  height: number
} {
  return getActiveLayoutArtRectFromState({
    currentLayout: layoutMode,
    cardData: { layout: registryLayoutFromLegacyMode(layoutMode) },
  })
}

export function registryLayoutFromLegacyMode(mode: CardLayoutMode): LayoutId {
  return layoutFromLegacyMode(mode)
}

export function registryLayoutToLegacyMode(layout: LayoutId): Exclude<CardLayoutMode, 'Hidden'> {
  return layoutToLegacyMode(layout)
}
