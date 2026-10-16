import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Image, Layer, Text, Ellipse } from 'react-konva'
import Konva from 'konva'
import { shallow } from 'zustand/shallow'
import { getStandardLayoutGeometry, METADATA_FONT_SIZE, SPELL_PRE_MODERN_NAME_STRIP_PADDING_PX, SPELL_PRE_MODERN_RULES_TEXT_SHIFT_UP_PX, SPELL_PRE_MODERN_RULES_TOP_PADDING_PX, SPELL_PRE_MODERN_SET_SYMBOL_SCALE, SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX, STAGE_WIDTH, BEVEL_INSET } from '../../../authority/geometryAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import {
  resolveSpellPreModernRulesInnerRect,
} from '../../../authority/spellPreModernLayoutAuthority'
import {
  getModernDummyManaPipGapPx,
  getModernDummyManaPipSizePx,
  getModernDummyManaStageRect,
  MODERN_COLLECTOR_DATA_DOWN_NUDGE_PX,
  MODERN_PLATE_TEXT_STROKE_COLOR,
  MODERN_PLATE_TEXT_STROKE_PX,
} from '../../../authority/modernDummyLayoutAuthority'
import {
  getLayoutRecipe,
  getRecipeTypographyMinSizePx,
  getRecipeTypographySizePx,
} from '../../../authority/recipes/layoutRecipeAuthority'
import { PW_MODERN_V2_COLLECTOR_DATA_DOWN_NUDGE_PX, PW_MODERN_V2_HOLOGRAM_DOWN_NUDGE_PX } from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { getPreModernTextBoxOuterRect } from '../../../authority/preModernTextBoxAuthority'
import { resolveCardCopyright } from '../../../authority/collectorDataAuthority'
import { resolveSetSymbolBoxPx, SYMBOL_BASELINE_OFFSET, getSpellPreModernManaCostIconSizePx } from '../../../authority/symbolAuthority'
import {
  layoutPtSlashCenteredText,
  type PtGlyphInkMetrics,
} from '../../../authority/ptTextLayoutAuthority'
import { buildCanvasFont } from '../../../data/fontCatalog'
import { useEffectiveTypographyFontKey } from '../../../hooks/useEffectiveTypographyFontKey'
import {
  getPreModernFaceFontStack,
  PRE_MODERN_FACE_FONT_STYLE,
  resolveTypographyFontFace,
  resolveTypographyInkColor,
  typographyPtToStagePx,
  TYPO_FLAVOR_PT_REF_PX,
  TYPO_METADATA_PT_REF_PX,
  TYPO_PT_BOX_REF_PX,
  TYPO_RULES_PT_REF_PX,
} from '../../../authority/typographyAuthority'
import { normalizeMana } from '../../../utils/manaNormalization'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import { normalizeRarity, RARITY_COLORS } from '../../../../rarityAuthority'
import {
  resolveChunks,
  splitPreserveWhitespaceAndNewlines,
  measureTextWidth as measureTextWidthFn,
  MANA_COST_ICON_SIZE,
  MANA_COST_ICON_GAP,
  scaleManaPipDisplaySizePx,
  NAME_MIN_FONT,
  NAME_PLATE_BASE_HEIGHT_RATIO,
  TYPE_MIN_FONT,
  TYPE_LINE_BASE_HEIGHT_RATIO,
  TYPE_LINE_TEXT_Y_NUDGE_PX,
  RULES_MAX_FONT,
  RULES_MIN_FONT,
  RULES_LINE_HEIGHT_RATIO,
  RULES_PADDING,
  FLAVOR_LINE_HEIGHT_RATIO,
  FLAVOR_PT_GAP,
  type RichChunk,
  type RichItem,
} from './textIconsShared'
import { isFullArtVariantLayout, getInnerBorderStageRect, isPkmnLayout, type LayoutId } from '../../../authority/layoutTaxonomy'
import {
  PKMN_COLLECTOR_BAR_CONTRAST_HEX,
  PKMN_COPYRIGHT_LEFT_NUDGE_PX,
  PKMN_FLAVOR_Y_NUDGE,
  PKMN_NAME_TEXT_LEFT_INSET,
} from '../../../authority/pkmnLayoutAuthority'
import { landFullArtManaCircleKeyToBracketToken } from '../../../authority/landFullArtManaCircle'
import { resolveReadableInkOnBoxPanel } from '../../../authority/boxPanelFillAuthority'
import { resolveReadableInkOnPanel } from '../../../utils/rulesPanelColor'
import {
  resolveInnerBorderContrastReferenceHex,
  resolveMetadataFooterContrastReferenceHex,
  resolveSpellPanelContrastReferenceHex,
  shouldDefaultWhiteInnerBorder,
} from '../../../authority/textBackgroundContrastAuthority'
import { resolvePreModernRulesTextBoxContrastReferenceHex } from '../../../data/preModernRulesTextBoxOptions'

/** Konva flag: center glyph ink (not em-box middle) when using verticalAlign. */
;(Konva as unknown as { _fixTextRendering: boolean })._fixTextRendering = true

type MeasuredRich = { heightUsed: number; lines: number }

/** Module 2.2 — subtle ink-spread softness (0.2–0.5). */
const INK_SPREAD_BLUR_RADIUS = 0.3
const TEXT_SHADOW_OFFSET = { x: 1, y: 1 }
const SECONDARY_STYLE_TEXT_FILL_LIGHT = '#fff'
const SECONDARY_STYLE_TEXT_FILL_DARK = '#111'
const SECONDARY_STYLE_STROKE_WIDTH = 2
const SECONDARY_STYLE_SHADOW_BLUR = 4
const FULL_ART_TEXT_FILL = '#f7f8fb'
const FULL_ART_TEXT_STROKE = 'rgba(0, 0, 0, 0.86)'
const FULL_ART_TEXT_SHADOW = 'rgba(0, 0, 0, 0.55)'
const PRE_MODERN_PT_BELOW_RULES_GAP_PX = 10
const PRE_MODERN_STANDARD_INLINE_PT_BELOW_TEXT_BOX_PX = 20
const PRE_MODERN_STANDARD_INLINE_PT_SIZE_SCALE = 0.75
const PRE_MODERN_FOOTER_LINE_GAP_PX = 6
/** Pre-Modern footer P/T — 2.25× the computed base size (125% larger than default). */
const PRE_MODERN_PT_SIZE_MULTIPLIER = 2.25

function getFullArtStrokeWidth(fontSize: number): number {
  const raw = Number.isFinite(fontSize) ? fontSize * 0.06 : 1.2
  return Math.max(1, Math.min(1.6, raw))
}

function toBoldStyle(fontStyle: string): string {
  return fontStyle.includes('italic') ? 'bold italic' : 'bold'
}

function darkenHex(hex: string, amount: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount))))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount))))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Layer 4 — Text & Icons.
 * Card name, mana cost, type line, rules text, flavor, P/T, set icon.
 */
function TextIconsLayer() {
  const layout = getStandardLayoutGeometry()
  const setIconPad = layout.setIconPad

  const nameBaseFontFromGeometry = Math.max(1, Math.floor(layout.nameH * NAME_PLATE_BASE_HEIGHT_RATIO))
  const typeBaseFontFromGeometry = Math.max(1, Math.floor(layout.typeH * TYPE_LINE_BASE_HEIGHT_RATIO))

  /** Single shallow subscription — Pre-5.2 had 32 parallel hooks; equality skips re-render when no picked field changes. */
  const {
    cardName,
    manaCost,
    cardTypeLine,
    colorIdentity,
    autoColorEnabled,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
    rulesText,
    flavorText,
    showFlavorTextOnCard,
    showPowerToughness,
    power,
    toughness,
    setIconImage,
    iconScale,
    set,
    collector_number,
    rarity,
    language,
    artist,
    copyright,
    showHologram,
    secondaryNameLightText,
    nameTypography,
    typeTypography,
    rulesTypography,
    flavorTypography,
    metadataTypography,
    ptTypography,
    currentLayout,
    activeLayout,
    landFullArtManaCircleKey,
    rulesTextBoxColor,
    nameBoxColor,
    typeLineBoxColor,
    nameBoxGradientEnabled,
    nameBoxGradientDirection,
    nameBoxGradientSaturation,
    nameBoxGradientReversed,
    typeLineBoxGradientEnabled,
    typeLineBoxGradientDirection,
    typeLineBoxGradientSaturation,
    typeLineBoxGradientReversed,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
    rulesTextBoxGradientReversed,
    innerBorderBackground,
    spellTextBoxId,
    preModernRulesTextBoxId,
    colorBlendDirection,
  } = useCardStore(
    (s) => ({
      cardName: s.cardData.name,
    manaCost: s.cardData.manaCost,
    cardTypeLine: s.cardData.typeLine,
      colorIdentity: s.cardData.colorIdentity,
      autoColorEnabled: s.autoColorEnabled,
      manualColorKey: s.manualColorKey,
      manualColorHex1: s.manualColorHex1,
      manualColorHex2: s.manualColorHex2,
      manualColorHex3: s.manualColorHex3,
      manualColorHex4: s.manualColorHex4,
      manualColorHex5: s.manualColorHex5,
      manualColorCount: s.manualColorCount,
      rulesText: s.cardData.cardText,
      flavorText: s.cardData.flavorText,
      showFlavorTextOnCard: s.cardData.showFlavorTextOnCard,
      showPowerToughness: s.cardData.showPowerToughness,
      power: s.cardData.power,
      toughness: s.cardData.toughness,
      setIconImage: s.cardData.setIconImage,
      iconScale: s.cardData.iconScale,
      set: s.cardData.set,
      collector_number: s.cardData.collector_number,
      rarity: s.cardData.rarity,
      language: s.cardData.language,
      artist: s.cardData.artist,
      copyright: s.cardData.copyright,
      showHologram: s.showHologram,
      secondaryNameLightText: s.cardData.secondaryNameLightText,
      nameTypography: s.cardData.nameTypography,
      typeTypography: s.cardData.typeTypography,
      rulesTypography: s.cardData.rulesTypography,
      flavorTypography: s.cardData.flavorTypography,
      metadataTypography: s.cardData.metadataTypography,
      ptTypography: s.cardData.ptTypography,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      landFullArtManaCircleKey: s.cardData.landFullArtManaCircleKey,
      rulesTextBoxColor: s.cardData.rulesTextBoxColor,
      nameBoxColor: s.cardData.nameBoxColor,
      typeLineBoxColor: s.cardData.typeLineBoxColor,
      nameBoxGradientEnabled: s.cardData.nameBoxGradientEnabled,
      nameBoxGradientDirection: s.cardData.nameBoxGradientDirection,
      nameBoxGradientSaturation: s.cardData.nameBoxGradientSaturation,
      nameBoxGradientReversed: s.cardData.nameBoxGradientReversed,
      typeLineBoxGradientEnabled: s.cardData.typeLineBoxGradientEnabled,
      typeLineBoxGradientDirection: s.cardData.typeLineBoxGradientDirection,
      typeLineBoxGradientSaturation: s.cardData.typeLineBoxGradientSaturation,
      typeLineBoxGradientReversed: s.cardData.typeLineBoxGradientReversed,
      rulesTextBoxGradientEnabled: s.cardData.rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection: s.cardData.rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation: s.cardData.rulesTextBoxGradientSaturation,
      rulesTextBoxGradientReversed: s.cardData.rulesTextBoxGradientReversed,
      innerBorderBackground: s.cardData.innerBorderBackground ?? 'identity',
      spellTextBoxId: s.cardData.spellTextBoxId,
      preModernRulesTextBoxId: s.cardData.preModernRulesTextBoxId,
      colorBlendDirection: s.colorBlendDirection,
    }),
    shallow,
  )
  const fullArtOnly = isFullArtVariantLayout(activeLayout)
  const activeRegions = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const activeCapabilities = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const landFullArtManaCircle = activeCapabilities.useLandFullArtManaCircle
  const standardFullArt = activeCapabilities.supportsFloatingTextTreatment
  const identityManaCost = landFullArtManaCircle
    ? landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey)
    : (manaCost ?? '')
  const identityPips = landFullArtManaCircle ? [] : colorIdentity
  const identityAutoColorEnabled = landFullArtManaCircle ? true : autoColorEnabled

  const suppressNameBarManaCostRendering = activeCapabilities.suppressNameBarManaCostRendering
  const suppressNameBarTextRendering = activeCapabilities.suppressNameBarTextRendering
  const suppressTypeLineTextRendering = activeCapabilities.suppressTypeLineTextRendering
  const suppressRulesTextRendering = activeCapabilities.suppressRulesTextRendering
  const supportsPlaneswalkerAbilities = activeCapabilities.supportsPlaneswalkerAbilities
  const supportsHologramSeal = activeCapabilities.supportsHologramSeal
  const supportsPreModernFooterLayout = activeCapabilities.supportsPreModernFooterLayout
  const supportsNamePlateBox = activeCapabilities.supportsNamePlateBox
  const supportsTypeLineBox = activeCapabilities.supportsTypeLineBox
  const supportsSpellTextBoxPanel = activeCapabilities.supportsSpellTextBoxPanel
  const supportsPreModernFaceLayout = activeCapabilities.supportsPreModernFaceLayout
  const supportsPreModernTextBoxFrame = activeCapabilities.supportsPreModernTextBoxFrame
  const supportsPreModernInlinePowerToughness = activeCapabilities.supportsPreModernInlinePowerToughness
  const supportsPowerToughnessBox = activeCapabilities.supportsPowerToughnessBox
  const supportsModernDummyLayout = activeCapabilities.supportsModernDummyLayout
  const supportsPlaneswalkerModernV2Layout = activeCapabilities.supportsPlaneswalkerModernV2Layout
  const collectorDataYAdjust =
    (supportsPlaneswalkerModernV2Layout
      ? PW_MODERN_V2_COLLECTOR_DATA_DOWN_NUDGE_PX
      : supportsModernDummyLayout
        ? MODERN_COLLECTOR_DATA_DOWN_NUDGE_PX
        : 0)
  const hologramYAdjust = supportsPlaneswalkerModernV2Layout ? PW_MODERN_V2_HOLOGRAM_DOWN_NUDGE_PX : 0
  const modernPlateTextStroke = supportsModernDummyLayout ? MODERN_PLATE_TEXT_STROKE_COLOR : undefined
  const modernPlateTextStrokeWidth = supportsModernDummyLayout ? MODERN_PLATE_TEXT_STROKE_PX : 0
  const layoutRecipe = supportsModernDummyLayout ? getLayoutRecipe(activeLayout) : null
  const nameManaIconSize = supportsPreModernFaceLayout
    ? getSpellPreModernManaCostIconSizePx()
    : supportsModernDummyLayout
      ? getModernDummyManaPipSizePx()
      : MANA_COST_ICON_SIZE
  const nameManaIconGap = supportsModernDummyLayout ? getModernDummyManaPipGapPx() : MANA_COST_ICON_GAP
  const recipeManaRect = supportsModernDummyLayout ? getModernDummyManaStageRect() : null
  const nameBaseFont = layoutRecipe
    ? getRecipeTypographySizePx(layoutRecipe, 'name')
    : nameBaseFontFromGeometry
  const typeBaseFont = layoutRecipe
    ? getRecipeTypographySizePx(layoutRecipe, 'type')
    : typeBaseFontFromGeometry
  const recipeNameMinFont = layoutRecipe
    ? getRecipeTypographyMinSizePx(layoutRecipe, 'name')
    : null
  const recipeTypeMinFont = layoutRecipe
    ? getRecipeTypographyMinSizePx(layoutRecipe, 'type')
    : null
  const recipeRulesSizePx = layoutRecipe
    ? getRecipeTypographySizePx(layoutRecipe, 'rules')
    : null
  const recipeRulesMinFont = layoutRecipe
    ? getRecipeTypographyMinSizePx(layoutRecipe, 'rules')
    : null
  const innerBorderBackgroundPreview = useCardStore((s) => s.innerBorderBackgroundPreview)

  const nameRect = layoutRegionToStageRect(activeRegions.nameBar)
  const artRect = layoutRegionToStageRect(activeRegions.art)
  const typeRect = layoutRegionToStageRect(activeRegions.typeLine)
  const rulesRect = layoutRegionToStageRect(activeRegions.rulesText)
  const metadataRect = layoutRegionToStageRect(activeRegions.metadataStrip)
  const lowerRightRect = activeRegions.lowerRight ? layoutRegionToStageRect(activeRegions.lowerRight.rect) : null

  const nameInnerX = nameRect.x
  const nameInnerY = nameRect.y
  const nameInnerW = nameRect.width
  const nameInnerH = nameRect.height
  const typeInnerX = typeRect.x
  const typeInnerY = typeRect.y
  const typeInnerW = typeRect.width
  const typeInnerH = typeRect.height
  const typeX = typeRect.x
  const typeY = typeRect.y
  const typeW = typeRect.width
  const typeH = typeRect.height
  const rulesInnerX = rulesRect.x
  const rulesInnerY = rulesRect.y
  const rulesInnerW = rulesRect.width
  const rulesInnerH = rulesRect.height
  const ptInnerX = lowerRightRect?.x ?? layout.ptInnerX
  const ptInnerY = lowerRightRect?.y ?? layout.ptInnerY
  const ptInnerW = lowerRightRect?.width ?? layout.ptInnerW
  const ptInnerH = lowerRightRect?.height ?? layout.ptInnerH
  const metadataLeftX = metadataRect.x
  const metadataRightX = metadataRect.x + metadataRect.width
  const pkmnCollectorLayout = isPkmnLayout(activeLayout)
  /** PKMN: keep collector ink inside the recessed strip (do not use type-line width). */
  const metadataTextW = pkmnCollectorLayout ? metadataRect.width : typeW
  const metadataLeftY = layout.metadataLeftY
  const metadataBaseline2 = layout.metadataBaseline2
  const copyrightY = layout.copyrightY

  const preModernFaceText = supportsPreModernFooterLayout
  /** Standard/Land: honor Content font/weight controls. Spell keeps locked pre-modern face fonts. */
  const honorCreativeFaceTypography =
    activeLayout.family === 'standard' || activeLayout.family === 'land'

  /** Matches set-symbol slot sizing (uploaded icon + Scryfall layer). */
  const iconBoxS = resolveSetSymbolBoxPx(iconScale) * (supportsPreModernFaceLayout ? SPELL_PRE_MODERN_SET_SYMBOL_SCALE : 1)
  const typeLineLeftPad = preModernFaceText ? 0 : 10
  const typeLineIconGap = 8
  const hasCustomSetIcon = Boolean(String(setIconImage ?? '').trim())
  const hasScryfallSetSlot = !hasCustomSetIcon && Boolean(String(set ?? '').trim())
  const reserveTypeLineForSetSymbol = hasCustomSetIcon || hasScryfallSetSlot
  const typeLineMaxWidth = Math.max(
    TYPE_MIN_FONT * 3,
    (preModernFaceText ? artRect.width : typeInnerW) -
      typeLineLeftPad * 2 -
      (reserveTypeLineForSetSymbol ? iconBoxS + setIconPad + typeLineIconGap : 0),
  )

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        identityPips,
        cardName,
        identityManaCost,
        identityAutoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      ),
    [
      cardTypeLine,
      landFullArtManaCircle,
      landFullArtManaCircleKey,
      identityPips,
      cardName,
      identityManaCost,
      identityAutoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )
  const identityStroke = resolvedIdentity.stroke
  const pinlineStroke = useMemo(() => darkenHex(identityStroke, 0.4), [identityStroke])
  const pinlineInnerStroke = useMemo(() => darkenHex(identityStroke, 0.62), [identityStroke])

  const defaultWhiteInnerBorder = useMemo(
    () =>
      shouldDefaultWhiteInnerBorder({
        autoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      }),
    [
      autoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const innerBorderContrastHex = useMemo(
    () =>
      resolveInnerBorderContrastReferenceHex(
        resolvedIdentity,
        innerBorderBackgroundPreview ?? innerBorderBackground ?? 'identity',
        defaultWhiteInnerBorder,
        colorBlendDirection,
      ),
    [
      resolvedIdentity,
      innerBorderBackgroundPreview,
      innerBorderBackground,
      defaultWhiteInnerBorder,
      colorBlendDirection,
    ],
  )

  const spellRulesPanelContrastHex = useMemo(
    () => resolveSpellPanelContrastReferenceHex(spellTextBoxId),
    [spellTextBoxId],
  )

  const preModernRulesPanelContrastHex = useMemo(
    () => resolvePreModernRulesTextBoxContrastReferenceHex(preModernRulesTextBoxId),
    [preModernRulesTextBoxId],
  )

  const rulesPanelAutoInk = useCallback(() => {
    if (supportsSpellTextBoxPanel) {
      return resolveReadableInkOnPanel(spellRulesPanelContrastHex)
    }
    if (supportsPreModernTextBoxFrame) {
      return resolveReadableInkOnPanel(preModernRulesPanelContrastHex)
    }
    return resolveReadableInkOnBoxPanel(
      rulesTextBoxColor,
      undefined,
      rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation,
    )
  }, [
    supportsSpellTextBoxPanel,
    supportsPreModernTextBoxFrame,
    spellRulesPanelContrastHex,
    preModernRulesPanelContrastHex,
    rulesTextBoxColor,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
  ])

  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const measureTextWidth = useCallback(
    (text: string, fontFamily: string, fontStyle: string, fontSize: number) => {
      if (!measureCtxRef.current) {
        const c = document.createElement('canvas')
        measureCtxRef.current = c.getContext('2d')
      }
      return measureTextWidthFn(measureCtxRef.current, text, fontFamily, fontStyle, fontSize)
    },
    []
  )

  const manaImageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const [manaImageTick, setManaImageTick] = useState(0)
  const getManaImage = useCallback((key: string, dataUrl: string) => {
    const cacheKey = `${key}::${dataUrl}`
    const existing = manaImageCache.current.get(cacheKey)
    if (existing) return existing
    const img = new window.Image()
    img.onload = () => setManaImageTick((t) => t + 1)
    img.onerror = () => setManaImageTick((t) => t + 1)
    img.src = dataUrl
    manaImageCache.current.set(cacheKey, img)
    return img
  }, [])

  const floorToHalfPx = useCallback((v: number) => Math.floor(v * 2) / 2, [])

  const getScaledSingleLineFontSize = useCallback(
    (opts: {
      text: string
      fontFamily: string
      fontStyle: string
      startSize: number
      minSize: number
      maxWidth: number
    }) => {
      const text = String(opts.text ?? '')
      const maxW = Math.max(1, opts.maxWidth)
      const minS = Math.max(1, opts.minSize)
      let lo = minS
      let hi = Math.max(minS, opts.startSize)
      if (measureTextWidth(text, opts.fontFamily, opts.fontStyle, hi) <= maxW) return floorToHalfPx(hi)
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2
        const w = measureTextWidth(text, opts.fontFamily, opts.fontStyle, mid)
        if (w <= maxW) lo = mid
        else hi = mid
      }
      return floorToHalfPx(lo)
    },
    [floorToHalfPx, measureTextWidth]
  )

  const measureRichText = useCallback(
    (
      chunks: RichChunk[],
      opts: {
        maxWidth: number
        maxHeight: number
        fontSize: number
        lineHeightPx: number
        iconSize: number
        fontFamily: string
        fontStyle: string
      }
    ): MeasuredRich => {
      const maxW = Math.max(1, opts.maxWidth)
      const lineH = Math.max(1, opts.lineHeightPx)
      let x = 0
      let y = 0
      let lines = 1
      const newLine = () => {
        x = 0
        y += lineH
        lines += 1
      }
      for (const c of chunks) {
        if (y + lineH > opts.maxHeight) break
        if (c.kind === 'text') {
          const tokens = splitPreserveWhitespaceAndNewlines(c.value)
          for (const t of tokens) {
            if (y + lineH > opts.maxHeight) break
            if (t === '\n') {
              newLine()
              continue
            }
            const wTok = measureTextWidth(t, opts.fontFamily, opts.fontStyle, opts.fontSize)
            const isSpace = /^\s+$/.test(t)
            if (!isSpace && x + wTok > maxW) newLine()
            if (y + lineH > opts.maxHeight) break
            if (isSpace && x === 0) continue
            x += wTok
          }
        } else {
          const iconSize = scaleManaPipDisplaySizePx(opts.iconSize, c.symbolSet)
          if (x + iconSize > maxW) newLine()
          if (y + lineH > opts.maxHeight) break
          x += iconSize
        }
      }
      return { heightUsed: Math.min(opts.maxHeight, y + lineH), lines }
    },
    [measureTextWidth]
  )

  const rulesPadTop = supportsSpellTextBoxPanel ? SPELL_PRE_MODERN_RULES_TOP_PADDING_PX : RULES_PADDING
  const rulesTextPadTop = supportsSpellTextBoxPanel
    ? rulesPadTop - SPELL_PRE_MODERN_RULES_TEXT_SHIFT_UP_PX
    : rulesPadTop
  const rulesPadBottom = RULES_PADDING
  const rulesPadX = RULES_PADDING

  const getScaledRulesFontSize = useCallback(
    (opts: {
      chunks: RichChunk[]
      startSize: number
      minSize: number
      maxSize: number
      boxWidth: number
      boxHeight: number
      padding?: number
      paddingTop?: number
      paddingBottom?: number
      paddingX?: number
      lineHeightRatio: number
      fontFamily: string
      fontStyle: string
    }) => {
      const minS = Math.max(1, opts.minSize)
      const maxS = Math.max(minS, opts.maxSize)
      const startS = Math.min(maxS, Math.max(minS, opts.startSize))
      const padX = opts.paddingX ?? opts.padding ?? RULES_PADDING
      const padTop = opts.paddingTop ?? opts.padding ?? RULES_PADDING
      const padBottom = opts.paddingBottom ?? opts.padding ?? RULES_PADDING
      const innerW = Math.max(1, opts.boxWidth - padX * 2)
      const innerH = Math.max(1, opts.boxHeight - padTop - padBottom)
      const fits = (size: number) => {
        const lineH = Math.max(1, size * opts.lineHeightRatio)
        const iconSize = size
        const m = measureRichText(opts.chunks, {
          maxWidth: innerW,
          maxHeight: innerH,
          fontSize: size,
          lineHeightPx: lineH,
          iconSize,
          fontFamily: opts.fontFamily,
          fontStyle: opts.fontStyle,
        })
        return m.heightUsed <= innerH
      }
      if (fits(startS)) return floorToHalfPx(startS)
      let lo = minS
      let hi = startS
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2
        if (fits(mid)) lo = mid
        else hi = mid
      }
      return floorToHalfPx(lo)
    },
    [floorToHalfPx, measureRichText]
  )

  const normalizedManaCost = normalizeMana(manaCost ?? '')
  // Issue #3: Rules text must not use shorthand mana expansion; only explicit `{...}` tokens are symbols.
  const normalizedRulesText = String(rulesText ?? '')
  const rulesChunks = useMemo(
    () => resolveChunks(normalizedRulesText),
    [normalizedRulesText, manaImageTick],
  )

  const effectiveNameFontKey = useEffectiveTypographyFontKey('nameTypography', nameTypography.fontKey)
  const effectiveTypeFontKey = useEffectiveTypographyFontKey('typeTypography', typeTypography.fontKey)
  const effectiveRulesFontKey = useEffectiveTypographyFontKey('rulesTypography', rulesTypography.fontKey)
  const effectiveFlavorFontKey = useEffectiveTypographyFontKey('flavorTypography', flavorTypography.fontKey)
  const effectiveMetadataFontKey = useEffectiveTypographyFontKey('metadataTypography', metadataTypography.fontKey)
  const effectivePtFontKey = useEffectiveTypographyFontKey('ptTypography', ptTypography.fontKey)

  const nameFace = useMemo(
    () =>
      preModernFaceText && !honorCreativeFaceTypography
        ? { fontStack: getPreModernFaceFontStack(), fontStyle: PRE_MODERN_FACE_FONT_STYLE }
        : resolveTypographyFontFace(effectiveNameFontKey, nameTypography.weight),
    [preModernFaceText, honorCreativeFaceTypography, effectiveNameFontKey, nameTypography.weight],
  )
  const nameStack = nameFace.fontStack
  const nameFontStyle = nameFace.fontStyle
  const nameInkOnPanel = useMemo(() => {
    const autoInk = supportsNamePlateBox
      ? resolveReadableInkOnBoxPanel(
          nameBoxColor,
          undefined,
          nameBoxGradientEnabled,
          nameBoxGradientDirection,
          nameBoxGradientSaturation,
        )
      : resolveReadableInkOnPanel(innerBorderContrastHex)
    return resolveTypographyInkColor(nameTypography, autoInk)
  }, [
    supportsNamePlateBox,
    innerBorderContrastHex,
    nameBoxColor,
    nameTypography,
    nameBoxGradientEnabled,
    nameBoxGradientDirection,
    nameBoxGradientSaturation,
  ])

  const typeFace = useMemo(
    () =>
      preModernFaceText && !honorCreativeFaceTypography
        ? { fontStack: getPreModernFaceFontStack(), fontStyle: PRE_MODERN_FACE_FONT_STYLE }
        : resolveTypographyFontFace(effectiveTypeFontKey, typeTypography.weight),
    [preModernFaceText, honorCreativeFaceTypography, effectiveTypeFontKey, typeTypography.weight],
  )
  const typeStack = typeFace.fontStack
  const typeFontStyle = typeFace.fontStyle
  const typeInkOnPanel = useMemo(() => {
    const autoInk = supportsTypeLineBox
      ? resolveReadableInkOnBoxPanel(
          typeLineBoxColor,
          undefined,
          typeLineBoxGradientEnabled,
          typeLineBoxGradientDirection,
          typeLineBoxGradientSaturation,
        )
      : resolveReadableInkOnPanel(innerBorderContrastHex)
    return resolveTypographyInkColor(typeTypography, autoInk)
  }, [
    supportsTypeLineBox,
    innerBorderContrastHex,
    typeLineBoxColor,
    typeTypography,
    typeLineBoxGradientEnabled,
    typeLineBoxGradientDirection,
    typeLineBoxGradientSaturation,
  ])

  const rulesFace = useMemo(
    () => resolveTypographyFontFace(effectiveRulesFontKey, rulesTypography.weight),
    [effectiveRulesFontKey, rulesTypography.weight],
  )
  const rulesStack = rulesFace.fontStack
  const rulesFontStyleKonva = rulesFace.fontStyle
  const rulesInkOnPanel = useMemo(() => {
    return resolveTypographyInkColor(rulesTypography, rulesPanelAutoInk())
  }, [rulesPanelAutoInk, rulesTypography])
  const rulesFallbackInkOnPanel = useMemo(() => {
    return resolveTypographyInkColor(rulesTypography, rulesPanelAutoInk())
  }, [rulesPanelAutoInk, rulesTypography])

  const flavorFace = useMemo(
    () => resolveTypographyFontFace(effectiveFlavorFontKey, flavorTypography.weight),
    [effectiveFlavorFontKey, flavorTypography.weight],
  )
  const flavorStack = flavorFace.fontStack
  const flavorFontStyleKonva = flavorFace.fontStyle
  const flavorInkOnPanel = useMemo(() => {
    return resolveTypographyInkColor(flavorTypography, rulesPanelAutoInk())
  }, [rulesPanelAutoInk, flavorTypography])

  const metadataFace = useMemo(
    () => resolveTypographyFontFace(effectiveMetadataFontKey, metadataTypography.weight),
    [effectiveMetadataFontKey, metadataTypography.weight],
  )
  const metadataStack = metadataFace.fontStack
  const metadataFontStyle = metadataFace.fontStyle
  const metadataFooterContrastHex = useMemo(
    () =>
      pkmnCollectorLayout
        ? PKMN_COLLECTOR_BAR_CONTRAST_HEX
        : resolveMetadataFooterContrastReferenceHex(supportsPreModernFooterLayout, innerBorderContrastHex),
    [pkmnCollectorLayout, supportsPreModernFooterLayout, innerBorderContrastHex],
  )
  const metadataFill = useMemo(() => {
    if (metadataTypography.colorManual) return metadataTypography.color
    return resolveReadableInkOnPanel(metadataFooterContrastHex, metadataTypography.color)
  }, [
    metadataTypography.color,
    metadataTypography.colorManual,
    metadataFooterContrastHex,
  ])
  const preModernPtInk = useMemo(
    () => resolveTypographyInkColor(ptTypography, resolveReadableInkOnPanel(innerBorderContrastHex)),
    [ptTypography, innerBorderContrastHex],
  )
  const fullArtTextFill = FULL_ART_TEXT_FILL
  const fullArtTextStroke = FULL_ART_TEXT_STROKE
  const fullArtTextShadow = FULL_ART_TEXT_SHADOW
  const secondaryStyleFill = secondaryNameLightText
    ? SECONDARY_STYLE_TEXT_FILL_LIGHT
    : SECONDARY_STYLE_TEXT_FILL_DARK
  const secondaryStyleStroke = secondaryNameLightText
    ? SECONDARY_STYLE_TEXT_FILL_DARK
    : SECONDARY_STYLE_TEXT_FILL_LIGHT
  const secondaryStyleShadow = secondaryNameLightText ? '#000' : '#fff'
  const effectiveRulesFontStyle = fullArtOnly ? toBoldStyle(rulesFontStyleKonva) : rulesFontStyleKonva
  const effectiveFlavorFontStyle = fullArtOnly ? toBoldStyle(flavorFontStyleKonva) : flavorFontStyleKonva
  const metadataFontSize = useMemo(() => {
    const px = typographyPtToStagePx(metadataTypography.sizePt, TYPO_METADATA_PT_REF_PX)
    // Keep metadata within a constrained envelope to preserve footer print-fit behavior.
    const base = floorToHalfPx(Math.max(METADATA_FONT_SIZE * 0.75, Math.min(METADATA_FONT_SIZE * 1.2, px)))
    if (!pkmnCollectorLayout) return base
    // PKMN footer strip — two left lines + right copyright, padded inside the box.
    const maxForBar = Math.max(14, Math.floor((metadataRect.height - 12) / 2))
    return floorToHalfPx(Math.min(base, maxForBar))
  }, [metadataTypography.sizePt, floorToHalfPx, pkmnCollectorLayout, metadataRect.height])

  /** PKMN: two left lines + copyright, optically centered in the recessed strip left of P/T. */
  const pkmnMetadataBaselines = useMemo(() => {
    if (!pkmnCollectorLayout) return null
    const gap = 4
    const blockH = metadataFontSize * 2 + gap
    // Bias slightly up — glyph descent reads heavy against the strip’s lower bevel.
    const top = metadataRect.y + Math.max(0, Math.round((metadataRect.height - blockH) / 2) - 2)
    const leftY = top + metadataFontSize
    const baseline2 = top + metadataFontSize + gap + metadataFontSize
    const copyrightY = top + Math.round((blockH + metadataFontSize) / 2)
    return { leftY, baseline2, copyrightY }
  }, [pkmnCollectorLayout, metadataFontSize, metadataRect.y, metadataRect.height])

  const metadataLeftYEff = pkmnMetadataBaselines?.leftY ?? metadataLeftY
  const metadataBaseline2Eff = pkmnMetadataBaselines?.baseline2 ?? metadataBaseline2
  const copyrightYEff = pkmnMetadataBaselines?.copyrightY ?? copyrightY

  const ptFace = useMemo(
    () => resolveTypographyFontFace(effectivePtFontKey, ptTypography.weight),
    [effectivePtFontKey, ptTypography.weight],
  )
  const ptStack = ptFace.fontStack
  const ptFontStyle = ptFace.fontStyle
  const preModernInnerBorder = useMemo(
    () =>
      getInnerBorderStageRect(activeLayout, {
        trimY: layout.trimY,
        trimH: layout.trimH,
        innerX: layout.innerX,
        innerY: layout.innerY,
        innerW: layout.innerW,
        innerH: layout.innerH,
      }),
    [activeLayout, layout.trimY, layout.trimH, layout.innerX, layout.innerY, layout.innerW, layout.innerH],
  )
  const innerBorderBottom = preModernInnerBorder.innerY + preModernInnerBorder.innerH
  const preModernPtFontSize = useMemo(() => {
    const target = typographyPtToStagePx(ptTypography.sizePt, TYPO_PT_BOX_REF_PX)
    const base = Math.min(target, Math.max(28, metadataFontSize * 1.35))
    const scaled = base * PRE_MODERN_PT_SIZE_MULTIPLIER
    const withStandardTextBoxScale = supportsPreModernTextBoxFrame
      ? scaled * PRE_MODERN_STANDARD_INLINE_PT_SIZE_SCALE
      : scaled
    return floorToHalfPx(withStandardTextBoxScale)
  }, [ptTypography.sizePt, metadataFontSize, floorToHalfPx, supportsPreModernTextBoxFrame])
  const showPreModernPowerToughness = supportsPreModernInlinePowerToughness && showPowerToughness

  const manaCostRender = useMemo(() => {
    const chunks = resolveChunks(normalizedManaCost)
    let totalWidth = 0
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      if (c.kind === 'icon') totalWidth += scaleManaPipDisplaySizePx(nameManaIconSize, c.symbolSet)
      else totalWidth += measureTextWidth(c.value, nameStack, nameFontStyle, nameManaIconSize)
      if (i < chunks.length - 1) totalWidth += nameManaIconGap
    }
    return { chunks, totalWidth }
  }, [
    normalizedManaCost,
    measureTextWidth,
    manaImageTick,
    nameStack,
    nameFontStyle,
    nameManaIconSize,
    nameManaIconGap,
  ])

  const nameLeftInset = pkmnCollectorLayout ? PKMN_NAME_TEXT_LEFT_INSET : 10
  const nameTextMaxW = suppressNameBarManaCostRendering
    ? Math.max(1, preModernFaceText ? artRect.width : nameInnerW)
    : Math.max(
        1,
        (preModernFaceText ? artRect.width : nameInnerW) -
          (preModernFaceText ? 0 : nameLeftInset + 10) -
          (manaCostRender.totalWidth > 0 ? manaCostRender.totalWidth + (preModernFaceText ? 6 : 10) : 0),
      )

  const nameSizeReferencePx = nameBaseFont
  const typeSizeReferencePx = typeBaseFont

  const nameTargetPx = useMemo(
    () => typographyPtToStagePx(nameTypography.sizePt, nameSizeReferencePx),
    [nameTypography.sizePt, nameSizeReferencePx],
  )

  const nameFontSize = useMemo(() => {
    const nameText = String(cardName ?? '')
    const target = nameTargetPx
    const minSize = Math.max(NAME_MIN_FONT, recipeNameMinFont ?? NAME_MIN_FONT)
    const fits = (size: number) => measureTextWidth(nameText, nameStack, nameFontStyle, size) <= nameTextMaxW
    let lo = minSize
    let hi = Math.max(lo, target)
    if (fits(hi)) return floorToHalfPx(hi)
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (fits(mid)) lo = mid
      else hi = mid
    }
    return floorToHalfPx(lo)
  }, [
    cardName,
    nameSizeReferencePx,
    nameTextMaxW,
    measureTextWidth,
    floorToHalfPx,
    nameStack,
    nameFontStyle,
    nameTargetPx,
    recipeNameMinFont,
  ])

  const typeTargetPx = useMemo(
    () => typographyPtToStagePx(typeTypography.sizePt, typeSizeReferencePx),
    [typeTypography.sizePt, typeSizeReferencePx],
  )

  const typeFontSize = useMemo(() => {
    const minSize = Math.max(TYPE_MIN_FONT, recipeTypeMinFont ?? TYPE_MIN_FONT)
    const start = Math.max(minSize, typeTargetPx)
    return getScaledSingleLineFontSize({
      text: String(cardTypeLine ?? ''),
      fontFamily: typeStack,
      fontStyle: typeFontStyle,
      startSize: start,
      minSize,
      maxWidth: Math.max(1, typeLineMaxWidth),
    })
  }, [
    cardTypeLine,
    getScaledSingleLineFontSize,
    typeSizeReferencePx,
    typeLineMaxWidth,
    typeStack,
    typeFontStyle,
    typeTargetPx,
    recipeTypeMinFont,
  ])

  const spellPreModernTypeTextY = useMemo(
    () => artRect.y + artRect.height + BEVEL_INSET + SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX,
    [artRect.y, artRect.height],
  )

  const spellArtOuterBottom = artRect.y + artRect.height + BEVEL_INSET
  const spellRulesInner = useMemo(
    () =>
      supportsSpellTextBoxPanel
        ? resolveSpellPreModernRulesInnerRect(layout, spellArtOuterBottom, typeFontSize)
        : null,
    [supportsSpellTextBoxPanel, layout, spellArtOuterBottom, typeFontSize],
  )

  const effectiveRulesInnerX = spellRulesInner?.x ?? rulesInnerX
  const effectiveRulesInnerY = spellRulesInner?.y ?? rulesInnerY
  const effectiveRulesInnerW = spellRulesInner?.width ?? rulesInnerW
  const effectiveRulesInnerH = spellRulesInner?.height ?? rulesInnerH
  const rulesClipY = supportsSpellTextBoxPanel
    ? effectiveRulesInnerY - SPELL_PRE_MODERN_RULES_TEXT_SHIFT_UP_PX
    : effectiveRulesInnerY
  const rulesClipH = supportsSpellTextBoxPanel
    ? effectiveRulesInnerH + SPELL_PRE_MODERN_RULES_TEXT_SHIFT_UP_PX
    : effectiveRulesInnerH

  const preModernTextBoxOuter = useMemo(
    () => (supportsPreModernTextBoxFrame ? getPreModernTextBoxOuterRect() : null),
    [supportsPreModernTextBoxFrame],
  )

  const rulesBoxBottom = preModernTextBoxOuter
    ? preModernTextBoxOuter.y + preModernTextBoxOuter.height + BEVEL_INSET
    : supportsSpellTextBoxPanel && spellRulesInner
      ? spellRulesInner.y + spellRulesInner.height + BEVEL_INSET
      : supportsPreModernFooterLayout
        ? rulesRect.y + rulesRect.height + BEVEL_INSET
        : layout.rulesY + layout.rulesH
  const preModernPtY = supportsPreModernTextBoxFrame
    ? rulesBoxBottom + PRE_MODERN_STANDARD_INLINE_PT_BELOW_TEXT_BOX_PX
    : rulesBoxBottom + PRE_MODERN_PT_BELOW_RULES_GAP_PX

  const preModernFooter = useMemo(() => {
    if (!supportsPreModernFooterLayout) return null
    const lineHeight = Math.round(metadataFontSize * 1.08)
    const setCode = String(set ?? '').trim().toUpperCase()
    const collector = String(collector_number ?? '').trim()
    const lang = String(language ?? '').trim().toUpperCase() || 'EN'
    const artistLine = String(artist ?? '').trim()
    const copyrightLine = resolveCardCopyright(copyright)
    const rarityLetter = rarity ? rarity.charAt(0).toUpperCase() : ''
    const rarityFill =
      rarity === 'common'
        ? '#FFFFFF'
        : rarity === 'uncommon'
          ? '#C0C0C0'
          : rarity === 'rare'
            ? '#FFD700'
            : rarity === 'mythic'
              ? '#E85D04'
              : '#FFFFFF'
    const collectorPrefix = [setCode, collector].some(Boolean)
      ? `${setCode || ''} / ${collector || ''}`.replace(/\s+/g, ' ').trim()
      : ''
    const collectorLine = `${collectorPrefix}${rarityLetter ? (collectorPrefix ? ' ' : '') + rarityLetter : ''}`.trim()
    const langArtistLine = `${lang}${artistLine ? ` • ${artistLine}` : ''}`.trim()
    const hasCollector = collectorLine.length > 0
    const hasLangArtist = langArtistLine.length > 0
    const hasCopyright = copyrightLine.length > 0
    const rowCount = (hasCollector ? 1 : 0) + (hasLangArtist ? 1 : 0) + (hasCopyright ? 1 : 0)
    if (rowCount === 0) return null
    const gap = PRE_MODERN_FOOTER_LINE_GAP_PX
    const blockHeight = rowCount * lineHeight + Math.max(0, rowCount - 1) * gap
    const collectorBandTop = rulesBoxBottom
    const collectorBandHeight = Math.max(1, innerBorderBottom - collectorBandTop)
    let y = collectorBandTop + Math.round((collectorBandHeight - blockHeight) / 2)
    const collectorY = hasCollector ? y : null
    if (hasCollector) y += lineHeight + gap
    const langArtistY = hasLangArtist ? y : null
    if (hasLangArtist) y += lineHeight + gap
    const copyrightLineY = hasCopyright ? y : null
    return {
      collectorLine,
      langArtistLine,
      copyrightLine,
      rarityLetter,
      rarityFill,
      hasCollector,
      hasLangArtist,
      hasCopyright,
      collectorY,
      langArtistY,
      copyrightLineY,
      metaX: metadataRect.x,
      metaW: metadataRect.width,
      collectorPrefix,
    }
  }, [
    supportsPreModernFooterLayout,
    set,
    collector_number,
    language,
    artist,
    copyright,
    rarity,
    metadataFontSize,
    metadataRect.x,
    metadataRect.width,
    rulesBoxBottom,
    innerBorderBottom,
  ])

  const rulesMaxFont = recipeRulesSizePx != null ? Math.max(RULES_MAX_FONT, recipeRulesSizePx) : RULES_MAX_FONT
  const rulesMinFont = recipeRulesMinFont != null ? Math.max(RULES_MIN_FONT, recipeRulesMinFont) : RULES_MIN_FONT
  const rulesSizeReferencePx = recipeRulesSizePx ?? TYPO_RULES_PT_REF_PX

  const rulesTargetStart = useMemo(
    () =>
      Math.max(
        rulesMinFont,
        Math.min(rulesMaxFont, typographyPtToStagePx(rulesTypography.sizePt, rulesSizeReferencePx)),
      ),
    [rulesTypography.sizePt, rulesMinFont, rulesMaxFont, rulesSizeReferencePx],
  )

  const rulesFontSize = useMemo(
    () =>
      getScaledRulesFontSize({
        chunks: rulesChunks,
        startSize: rulesTargetStart,
        minSize: rulesMinFont,
        maxSize: rulesMaxFont,
        boxWidth: effectiveRulesInnerW,
        boxHeight: effectiveRulesInnerH,
        paddingTop: rulesTextPadTop,
        paddingBottom: rulesPadBottom,
        paddingX: rulesPadX,
        lineHeightRatio: RULES_LINE_HEIGHT_RATIO,
        fontFamily: rulesStack,
        fontStyle: rulesFontStyleKonva,
      }),
    [
      getScaledRulesFontSize,
      rulesChunks,
      effectiveRulesInnerW,
      effectiveRulesInnerH,
      rulesTextPadTop,
      rulesPadBottom,
      rulesPadX,
      rulesStack,
      rulesFontStyleKonva,
      rulesTargetStart,
      rulesMinFont,
      rulesMaxFont,
    ]
  )
  const effectiveRulesFontSize = fullArtOnly ? floorToHalfPx(rulesFontSize * 1.25) : rulesFontSize

  const rulesLineHeight = useMemo(
    () => floorToHalfPx(effectiveRulesFontSize * RULES_LINE_HEIGHT_RATIO),
    [effectiveRulesFontSize, floorToHalfPx]
  )
  const rulesIconSize = effectiveRulesFontSize

  const rulesRender = useMemo((): RichItem[] => {
    const items: RichItem[] = []
    const innerW = Math.max(1, effectiveRulesInnerW - rulesPadX * 2)
    const innerH = Math.max(1, effectiveRulesInnerH - rulesTextPadTop - rulesPadBottom)
    const maxX = effectiveRulesInnerX + rulesPadX + innerW
    const maxY = effectiveRulesInnerY + rulesTextPadTop + innerH
    let x = effectiveRulesInnerX + rulesPadX
    let y = effectiveRulesInnerY + rulesTextPadTop
    const lineTopForText = () => y + Math.max(0, (rulesLineHeight - effectiveRulesFontSize) / 2)
    const lineTopForIcon = (displaySize: number) =>
      y + Math.max(0, (rulesLineHeight - displaySize) / 2) + SYMBOL_BASELINE_OFFSET
    const newLine = () => {
      x = effectiveRulesInnerX + rulesPadX
      y += rulesLineHeight
    }
    for (const c of rulesChunks) {
      if (y + rulesLineHeight > maxY) break
      if (c.kind === 'text') {
        const tokens = splitPreserveWhitespaceAndNewlines(c.value)
        for (const t of tokens) {
          if (y + rulesLineHeight > maxY) break
          if (t === '\n') {
            newLine()
            continue
          }
          const wTok = measureTextWidth(t, rulesStack, effectiveRulesFontStyle, effectiveRulesFontSize)
          const isSpace = /^\s+$/.test(t)
          if (!isSpace && x + wTok > maxX) newLine()
          if (y + rulesLineHeight > maxY) break
          if (isSpace && x === effectiveRulesInnerX + rulesPadX) continue
          items.push({ kind: 'text', text: t, x, y: lineTopForText(), width: wTok })
          x += wTok
        }
      } else {
        const iconSize = scaleManaPipDisplaySizePx(rulesIconSize, c.symbolSet)
        if (x + iconSize > maxX) newLine()
        if (y + rulesLineHeight > maxY) break
        items.push({
          kind: 'icon',
          key: c.key,
          dataUrl: c.dataUrl,
          rawToken: c.token,
          x,
          y: lineTopForIcon(iconSize),
          size: iconSize,
        })
        x += iconSize
      }
    }
    return items
  }, [
    rulesChunks,
    effectiveRulesFontSize,
    rulesIconSize,
    rulesLineHeight,
    effectiveRulesInnerX,
    effectiveRulesInnerY,
    effectiveRulesInnerW,
    effectiveRulesInnerH,
    rulesTextPadTop,
    rulesPadX,
    measureTextWidth,
    rulesStack,
    effectiveRulesFontStyle,
  ])

  const flavorFontSize = useMemo(() => {
    const raw = typographyPtToStagePx(flavorTypography.sizePt, TYPO_FLAVOR_PT_REF_PX)
    const cap = Math.max(RULES_MIN_FONT, effectiveRulesInnerH * 0.14)
    return floorToHalfPx(Math.min(raw, cap))
  }, [flavorTypography.sizePt, effectiveRulesInnerH, floorToHalfPx])
  const effectiveFlavorFontSize = fullArtOnly ? floorToHalfPx(flavorFontSize * 1.25) : flavorFontSize
  const flavorLineHeight = useMemo(
    () => floorToHalfPx(effectiveFlavorFontSize * FLAVOR_LINE_HEIGHT_RATIO),
    [effectiveFlavorFontSize, floorToHalfPx]
  )
  const flavorMaxWidth = Math.max(1, effectiveRulesInnerW - RULES_PADDING * 2)
  const fullWidth = flavorMaxWidth
  const supportsMetadataStrip = activeCapabilities.supportsMetadataStrip
  const landRulesAsSecondaryArt = activeCapabilities.supportsLandSecondaryArtInRulesRegion
  const showPowerToughnessEffective = showPowerToughness && supportsPowerToughnessBox

  const narrowWidth = showPowerToughnessEffective
    ? Math.max(1, ptInnerX - (effectiveRulesInnerX + RULES_PADDING) - FLAVOR_PT_GAP)
    : fullWidth

  const flavorRender = useMemo(() => {
    if (supportsPlaneswalkerAbilities && !showFlavorTextOnCard) return []
    const raw = String(flavorText ?? '').trim()
    if (!raw) return []
    const leftX = effectiveRulesInnerX + RULES_PADDING
    const bottomY = effectiveRulesInnerY + effectiveRulesInnerH - RULES_PADDING
    const maxWidth = fullWidth
    const lines: string[] = []
    const paragraphs = raw.split(/\n+/)
    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean)
      if (words.length === 0) continue
      let line = ''
      for (const word of words) {
        const candidate = line ? line + ' ' + word : word
        const w = measureTextWidth(candidate, flavorStack, effectiveFlavorFontStyle, effectiveFlavorFontSize)
        if (w > maxWidth && line) {
          lines.push(line)
          line = word
        } else if (w > maxWidth && !line) {
          lines.push(word)
          line = ''
        } else {
          line = candidate
        }
      }
      if (line) lines.push(line)
    }
    if (showPowerToughnessEffective && narrowWidth < fullWidth && lines.length > 0) {
      const lastLine = lines[lines.length - 1]
      const lastW = measureTextWidth(lastLine, flavorStack, effectiveFlavorFontStyle, effectiveFlavorFontSize)
      if (lastW > narrowWidth) {
        const words = lastLine.split(' ')
        let fitsLine = ''
        let splitIdx = 0
        for (let i = 0; i < words.length; i++) {
          const candidate = fitsLine ? fitsLine + ' ' + words[i] : words[i]
          const w = measureTextWidth(candidate, flavorStack, effectiveFlavorFontStyle, effectiveFlavorFontSize)
          if (w > narrowWidth) break
          fitsLine = candidate
          splitIdx = i + 1
        }
        if (splitIdx > 0 && splitIdx < words.length) {
          const overflowLine = words.slice(splitIdx).join(' ')
          lines[lines.length - 1] = fitsLine
          lines.splice(lines.length - 1, 0, overflowLine)
        }
      }
    }
    const flavorLift = flavorLineHeight
    const pkmnFlavorNudge = pkmnCollectorLayout ? PKMN_FLAVOR_Y_NUDGE : 0
    return lines.map((text, i) => {
      const naturalY = bottomY - (lines.length - i) * flavorLineHeight - flavorLift + pkmnFlavorNudge
      const maxY = bottomY - (lines.length - i) * flavorLineHeight
      return {
        text,
        x: leftX,
        y: Math.min(naturalY, maxY),
        width: maxWidth,
        align: undefined as 'center' | undefined,
      }
    })
  }, [
    flavorText,
    effectiveRulesInnerX,
    effectiveRulesInnerY,
    effectiveRulesInnerW,
    effectiveRulesInnerH,
    effectiveFlavorFontSize,
    flavorLineHeight,
    measureTextWidth,
    showPowerToughnessEffective,
    pkmnCollectorLayout,
    ptInnerX,
    fullWidth,
    narrowWidth,
    flavorStack,
    effectiveFlavorFontStyle,
    supportsPlaneswalkerAbilities,
    showFlavorTextOnCard,
  ])

  const [setIconImg, setSetIconImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!setIconImage) {
      setSetIconImg(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setSetIconImg(img)
    img.onerror = () => setSetIconImg(null)
    img.src = setIconImage
  }, [setIconImage])

  const blurGroupRef = useRef<Konva.Group>(null)
  const typographyFontPreview = useCardStore((s) => s.typographyFontPreview)
  /** Debounce ink-spread cache() so rules/name keystrokes don't rebuild the filtered bitmap every frame. */
  const BLUR_CACHE_DEBOUNCE_MS = 280
  const blurCacheGenRef = useRef(0)

  // Text-content edits: clear stale bitmap immediately, re-cache after typing pauses.
  useEffect(() => {
    blurGroupRef.current?.clearCache()
    const gen = ++blurCacheGenRef.current
    const id = window.setTimeout(() => {
      if (gen !== blurCacheGenRef.current) return
      blurGroupRef.current?.cache()
    }, BLUR_CACHE_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [
    cardName,
    normalizedManaCost,
    manaImageTick,
    cardTypeLine,
    normalizedRulesText,
    flavorText,
  ])

  // Style / layout / asset changes: rebuild blur cache promptly for correct ink-spread look.
  useEffect(() => {
    blurGroupRef.current?.clearCache()
    const gen = ++blurCacheGenRef.current
    // rAF so Konva has applied the latest child props before caching.
    const id = window.requestAnimationFrame(() => {
      if (gen !== blurCacheGenRef.current) return
      blurGroupRef.current?.cache()
    })
    return () => window.cancelAnimationFrame(id)
  }, [
    showPowerToughnessEffective,
    setIconImg,
    /** Set symbol slot + type-line width reserve; must bust blur cache when size changes. */
    iconBoxS,
    nameTypography,
    typeTypography,
    rulesTypography,
    flavorTypography,
    typographyFontPreview,
    rulesTextBoxColor,
    nameBoxColor,
    typeLineBoxColor,
    nameBoxGradientEnabled,
    nameBoxGradientDirection,
    nameBoxGradientSaturation,
    nameBoxGradientReversed,
    typeLineBoxGradientEnabled,
    typeLineBoxGradientDirection,
    typeLineBoxGradientSaturation,
    typeLineBoxGradientReversed,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
    rulesTextBoxGradientReversed,
    currentLayout,
    activeLayout,
    suppressNameBarManaCostRendering,
    suppressNameBarTextRendering,
    suppressTypeLineTextRendering,
    suppressRulesTextRendering,
    landRulesAsSecondaryArt,
    supportsPlaneswalkerAbilities,
    showFlavorTextOnCard,
    // flavorRender is driven by flavorText (text-debounce path) + geometry/typography deps above.
    ptInnerX,
    ptInnerY,
    ptInnerW,
    ptInnerH,
  ])

  return (
    <Layer listening={false}>
      <Group
        ref={blurGroupRef}
        filters={[Konva.Filters.Blur]}
        blurRadius={INK_SPREAD_BLUR_RADIUS}
        listening={false}
      >
      {!suppressNameBarTextRendering && (
      <Text
        text={cardName}
        x={suppressNameBarManaCostRendering ? nameInnerX : preModernFaceText ? artRect.x : nameInnerX + nameLeftInset}
        y={
          supportsPreModernFaceLayout
            ? nameInnerY + SPELL_PRE_MODERN_NAME_STRIP_PADDING_PX
            : preModernFaceText
              ? nameInnerY
              : nameInnerY + 2
        }
        width={suppressNameBarManaCostRendering ? nameInnerW : nameTextMaxW}
        align={suppressNameBarManaCostRendering ? 'center' : 'left'}
        height={
          supportsPreModernFaceLayout
            ? nameManaIconSize
            : preModernFaceText
              ? nameInnerH
              : nameInnerH - 4
        }
        fontFamily={nameStack}
        fontStyle={standardFullArt ? 'bold' : nameFontStyle}
        fontSize={nameFontSize}
        fill={standardFullArt ? secondaryStyleFill : nameInkOnPanel}
        stroke={standardFullArt ? secondaryStyleStroke : modernPlateTextStroke}
        strokeWidth={standardFullArt ? SECONDARY_STYLE_STROKE_WIDTH : modernPlateTextStrokeWidth}
        shadowColor={standardFullArt ? secondaryStyleShadow : undefined}
        shadowBlur={standardFullArt ? SECONDARY_STYLE_SHADOW_BLUR : 0}
        shadowOffset={standardFullArt ? TEXT_SHADOW_OFFSET : undefined}
        verticalAlign="middle"
      />
      )}

      {!suppressNameBarManaCostRendering && manaCostRender.chunks.length > 0 && (
        <Group
          x={Math.round(
            (preModernFaceText
              ? artRect.x + artRect.width
              : recipeManaRect
                ? recipeManaRect.x + recipeManaRect.width
                : nameInnerX + nameInnerW - 10) - manaCostRender.totalWidth,
          )}
          y={Math.round(
            recipeManaRect
              ? recipeManaRect.y + (recipeManaRect.height - nameManaIconSize) / 2
              : nameInnerY + (nameInnerH - nameManaIconSize) / 2,
          )}
        >
          {(() => {
            let dx = 0
            const lastIdx = manaCostRender.chunks.length - 1
            return manaCostRender.chunks.map((c, i) => {
              if (c.kind === 'icon') {
                const iconSize = scaleManaPipDisplaySizePx(nameManaIconSize, c.symbolSet)
                const yOffset = (nameManaIconSize - iconSize) / 2
                const img = getManaImage(c.key, c.dataUrl)
                const useFallback = !img || (img.complete && img.naturalWidth === 0)
                const node = useFallback ? (
                  <Text
                    key={`mc-fallback-${i}-${c.key}`}
                    text={c.token}
                    x={dx}
                    y={yOffset}
                    width={iconSize}
                    height={iconSize}
                    fontFamily={nameStack}
                    fontStyle={nameFontStyle}
                    fontSize={iconSize}
                    fill="#666"
                    stroke={modernPlateTextStroke}
                    strokeWidth={modernPlateTextStrokeWidth}
                    verticalAlign="middle"
                    listening={false}
                  />
                ) : (
                  <Fragment key={`mc-icon-${i}-${c.key}`}>
                    <Text
                      text=""
                      opacity={0}
                      x={dx}
                      y={yOffset}
                      width={iconSize}
                      height={iconSize}
                      listening={false}
                    />
                    <Image
                      image={img}
                      x={dx}
                      y={yOffset}
                      width={iconSize}
                      height={iconSize}
                      listening={false}
                    />
                  </Fragment>
                )
                dx += iconSize
                if (i < lastIdx) dx += nameManaIconGap
                return node
              }
              const wText = measureTextWidth(c.value, nameStack, nameFontStyle, nameManaIconSize)
              const node = (
                <Text
                  key={`mc-text-${i}`}
                  text={c.value}
                  x={dx}
                  y={0}
                  width={wText}
                  height={nameManaIconSize}
                  fontFamily={nameStack}
                  fontStyle={nameFontStyle}
                  fontSize={nameManaIconSize}
                  fill={standardFullArt ? secondaryStyleFill : nameInkOnPanel}
                  stroke={modernPlateTextStroke}
                  strokeWidth={modernPlateTextStrokeWidth}
                  verticalAlign="middle"
                  listening={false}
                />
              )
              dx += wText
              if (i < lastIdx) dx += nameManaIconGap
              return node
            })
          })()}
        </Group>
      )}

      {!suppressTypeLineTextRendering && (
      <Text
        text={cardTypeLine}
        x={preModernFaceText ? artRect.x + typeLineLeftPad : typeInnerX + typeLineLeftPad}
        y={floorToHalfPx(
          supportsPreModernFaceLayout
            ? spellPreModernTypeTextY
            : preModernFaceText
              ? typeInnerY
              : typeInnerY + TYPE_LINE_TEXT_Y_NUDGE_PX,
        )}
        width={typeLineMaxWidth}
        height={supportsPreModernFaceLayout ? typeFontSize : typeInnerH}
        wrap="none"
        lineHeight={1}
        fontFamily={typeStack}
        fontStyle={standardFullArt ? 'bold' : typeFontStyle}
        fontSize={typeFontSize}
        fill={standardFullArt ? secondaryStyleFill : typeInkOnPanel}
        stroke={standardFullArt ? secondaryStyleStroke : modernPlateTextStroke}
        strokeWidth={standardFullArt ? SECONDARY_STYLE_STROKE_WIDTH : modernPlateTextStrokeWidth}
        shadowColor={standardFullArt ? secondaryStyleShadow : undefined}
        shadowBlur={standardFullArt ? SECONDARY_STYLE_SHADOW_BLUR : 0}
        shadowOffset={standardFullArt ? TEXT_SHADOW_OFFSET : undefined}
        align="left"
        verticalAlign={supportsPreModernFaceLayout ? 'top' : 'middle'}
      />
      )}

      <Group
        clipX={effectiveRulesInnerX}
        clipY={rulesClipY}
        clipWidth={effectiveRulesInnerW}
        clipHeight={rulesClipH}
      >
        {!landRulesAsSecondaryArt &&
          !suppressRulesTextRendering &&
          !supportsPlaneswalkerAbilities &&
          rulesRender.map((it, idx) =>
          it.kind === 'icon' ? (() => {
            const img = getManaImage(it.key, it.dataUrl)
            const useFallback = !img || (img.complete && img.naturalWidth === 0)
            return useFallback ? (
              <Text
                key={`rt-fallback-${idx}-${it.key}`}
                text={it.rawToken}
                x={it.x}
                y={it.y}
                width={it.size}
                height={it.size}
                fontFamily={rulesStack}
                fontStyle={effectiveRulesFontStyle}
                fontSize={effectiveRulesFontSize}
                fill={standardFullArt ? secondaryStyleFill : fullArtOnly ? fullArtTextFill : rulesFallbackInkOnPanel}
                stroke={standardFullArt ? secondaryStyleStroke : fullArtOnly ? fullArtTextStroke : undefined}
                strokeWidth={standardFullArt ? SECONDARY_STYLE_STROKE_WIDTH : fullArtOnly ? getFullArtStrokeWidth(effectiveRulesFontSize) : 0}
                shadowColor={standardFullArt ? secondaryStyleShadow : fullArtOnly ? fullArtTextShadow : undefined}
                shadowBlur={standardFullArt ? SECONDARY_STYLE_SHADOW_BLUR : fullArtOnly ? 2 : 0}
                shadowOffset={standardFullArt ? TEXT_SHADOW_OFFSET : fullArtOnly ? TEXT_SHADOW_OFFSET : undefined}
                listening={false}
              />
            ) : (
              <Fragment key={`rt-icon-${idx}-${it.key}`}>
                <Text
                  text=""
                  opacity={0}
                  x={it.x}
                  y={it.y}
                  width={it.size}
                  height={it.size}
                  listening={false}
                />
                <Image
                  image={img}
                  x={it.x}
                  y={it.y}
                  width={it.size}
                  height={it.size}
                  listening={false}
                />
              </Fragment>
            )
          })() : (
            <Text
              key={`rt-text-${idx}`}
              text={it.text}
              x={it.x}
              y={it.y}
              width={it.width}
              height={rulesLineHeight}
              fontFamily={rulesStack}
              fontStyle={standardFullArt ? 'bold' : effectiveRulesFontStyle}
              fontSize={effectiveRulesFontSize}
              fill={standardFullArt ? secondaryStyleFill : fullArtOnly ? fullArtTextFill : rulesInkOnPanel}
              stroke={standardFullArt ? secondaryStyleStroke : fullArtOnly ? fullArtTextStroke : undefined}
              strokeWidth={standardFullArt ? SECONDARY_STYLE_STROKE_WIDTH : fullArtOnly ? getFullArtStrokeWidth(effectiveRulesFontSize) : 0}
              shadowColor={standardFullArt ? secondaryStyleShadow : fullArtOnly ? fullArtTextShadow : undefined}
              shadowBlur={standardFullArt ? SECONDARY_STYLE_SHADOW_BLUR : fullArtOnly ? 2 : 0}
              shadowOffset={standardFullArt ? TEXT_SHADOW_OFFSET : fullArtOnly ? TEXT_SHADOW_OFFSET : undefined}
              listening={false}
            />
          )
        )}
        {!landRulesAsSecondaryArt &&
          flavorRender.map((line, idx) => (
          <Text
            key={`flavor-${idx}`}
            text={line.text}
            x={line.x}
            y={line.y}
            width={line.width ?? flavorMaxWidth}
            align={line.align}
            fontFamily={flavorStack}
            fontStyle={effectiveFlavorFontStyle}
            fontSize={effectiveFlavorFontSize}
            fill={standardFullArt ? secondaryStyleFill : fullArtOnly ? fullArtTextFill : flavorInkOnPanel}
            stroke={standardFullArt ? secondaryStyleStroke : fullArtOnly ? fullArtTextStroke : undefined}
            strokeWidth={standardFullArt ? SECONDARY_STYLE_STROKE_WIDTH : fullArtOnly ? getFullArtStrokeWidth(effectiveFlavorFontSize) : 0}
            shadowColor={standardFullArt ? secondaryStyleShadow : fullArtOnly ? fullArtTextShadow : undefined}
            shadowBlur={standardFullArt ? SECONDARY_STYLE_SHADOW_BLUR : fullArtOnly ? 2 : 0}
            shadowOffset={standardFullArt ? TEXT_SHADOW_OFFSET : fullArtOnly ? TEXT_SHADOW_OFFSET : undefined}
            listening={false}
          />
        ))}
      </Group>

      {!suppressTypeLineTextRendering && setIconImg && (
        <Group
          key={`custom-set-icon-${iconBoxS}`}
          x={(preModernFaceText ? artRect.x + artRect.width : typeX + typeW) - iconBoxS - setIconPad}
          y={
            supportsPreModernFaceLayout
              ? spellPreModernTypeTextY + (typeFontSize - iconBoxS) / 2
              : typeY + (typeH - iconBoxS) / 2
          }
          clipX={0}
          clipY={0}
          clipWidth={iconBoxS}
          clipHeight={iconBoxS}
          listening={false}
        >
          <Image
            image={setIconImg}
            x={0}
            y={0}
            width={iconBoxS}
            height={iconBoxS}
            listening={false}
          />
        </Group>
      )}
      </Group>

      {supportsMetadataStrip && !supportsPreModernFooterLayout &&
        (() => {
        const setCode = String(set ?? '').trim().toUpperCase()
        const collector = String(collector_number ?? '').trim()
        const metaPrefix = [setCode, collector].some(Boolean)
          ? `${setCode || ''} / ${collector || ''}`.replace(/\s+/g, ' ').trim()
          : ''
        const rarityLetter = rarity ? rarity.charAt(0).toUpperCase() : ''
        const metaPrefixWithSpace = metaPrefix + (rarityLetter ? ' ' : '')
        const rarityFill =
          rarity === 'common'
            ? '#FFFFFF'
            : rarity === 'uncommon'
              ? '#C0C0C0'
              : rarity === 'rare'
                ? '#FFD700'
                : rarity === 'mythic'
                  ? '#E85D04'
                  : '#FFFFFF'
        return (
          <>
            <Text
              text={metaPrefixWithSpace}
              x={metadataLeftX}
              y={metadataLeftYEff - metadataFontSize + (pkmnCollectorLayout ? 0 : collectorDataYAdjust)}
              width={metadataTextW}
              fontFamily={metadataStack}
              fontStyle={metadataFontStyle}
              fontSize={metadataFontSize}
              fill={metadataFill}
              opacity={1}
              letterSpacing={-0.2}
              listening={false}
            />
            {rarityLetter ? (
              <Text
                text={rarityLetter}
                x={metadataLeftX + measureTextWidth(metaPrefixWithSpace, metadataStack, metadataFontStyle, metadataFontSize)}
                y={metadataLeftYEff - metadataFontSize + (pkmnCollectorLayout ? 0 : collectorDataYAdjust)}
                fontFamily={metadataStack}
                fontStyle={metadataFontStyle}
                fontSize={metadataFontSize}
                fill={rarityFill}
                opacity={1}
                letterSpacing={-0.2}
                listening={false}
              />
            ) : null}
          </>
        )
        })()}
      {showPreModernPowerToughness &&
        (() => {
          const boxX = preModernTextBoxOuter?.x ?? rulesRect.x - BEVEL_INSET
          const boxW = preModernTextBoxOuter?.width ?? rulesRect.width + 2 * BEVEL_INSET
          const lineH = Math.max(preModernPtFontSize, Math.round(preModernPtFontSize * 1.15))
          const measureInk = (
            text: string,
            fontFamily: string,
            fontStyle: string,
            fontSize: number,
          ): PtGlyphInkMetrics => {
            if (!measureCtxRef.current) {
              const c = document.createElement('canvas')
              measureCtxRef.current = c.getContext('2d')
            }
            const ctx = measureCtxRef.current
            if (!ctx) {
              return {
                ascent: fontSize * 0.7,
                descent: 0,
                fontAscent: fontSize * 0.7,
                fontDescent: fontSize * 0.2,
              }
            }
            ctx.font = buildCanvasFont(fontStyle, fontSize, fontFamily)
            const m = ctx.measureText(text)
            const ascent = m.actualBoundingBoxAscent || fontSize * 0.7
            const descent = m.actualBoundingBoxDescent || 0
            return {
              ascent,
              descent,
              fontAscent: m.fontBoundingBoxAscent || ascent,
              fontDescent: m.fontBoundingBoxDescent || descent,
            }
          }
          const parts = layoutPtSlashCenteredText({
            power: String(power ?? ''),
            toughness: String(toughness ?? ''),
            boxX,
            boxY: preModernPtY,
            boxW,
            boxH: lineH,
            fontFamily: ptStack,
            fontStyle: ptFontStyle,
            fontSize: preModernPtFontSize,
            align: 'right',
            padX: 0,
            measure: measureTextWidth,
            measureInk,
          })
          return (
            <Group listening={false}>
              {([parts.power, parts.slash, parts.toughness] as const).map((part, i) => (
                <Text
                  key={`pre-modern-pt-${i}`}
                  text={part.text}
                  x={part.x}
                  y={part.y}
                  width={part.width}
                  height={part.height}
                  fontFamily={ptStack}
                  fontStyle={ptFontStyle}
                  fontSize={preModernPtFontSize}
                  fill={preModernPtInk}
                  verticalAlign="middle"
                  align="center"
                  listening={false}
                />
              ))}
            </Group>
          )
        })()}
      {supportsPreModernFooterLayout && preModernFooter ? (
        <>
          {preModernFooter.hasCollector && preModernFooter.collectorY != null ? (
            <>
              <Text
                key={`pre-modern-footer-collector-${metadataFill}`}
                text={preModernFooter.collectorPrefix + (preModernFooter.rarityLetter ? ' ' : '')}
                x={preModernFooter.metaX}
                y={preModernFooter.collectorY}
                width={preModernFooter.metaW}
                fontFamily={metadataStack}
                fontStyle={metadataFontStyle}
                fontSize={metadataFontSize}
                fill={metadataFill}
                align="center"
                opacity={1}
                letterSpacing={-0.2}
                listening={false}
              />
              {preModernFooter.rarityLetter ? (
                <Text
                  text={preModernFooter.rarityLetter}
                  x={
                    preModernFooter.metaX +
                    Math.round(
                      (preModernFooter.metaW -
                        measureTextWidth(
                          preModernFooter.collectorLine,
                          metadataStack,
                          metadataFontStyle,
                          metadataFontSize,
                        )) /
                        2,
                    ) +
                    measureTextWidth(
                      preModernFooter.collectorPrefix + (preModernFooter.collectorPrefix ? ' ' : ''),
                      metadataStack,
                      metadataFontStyle,
                      metadataFontSize,
                    )
                  }
                  y={preModernFooter.collectorY}
                  fontFamily={metadataStack}
                  fontStyle={metadataFontStyle}
                  fontSize={metadataFontSize}
                  fill={preModernFooter.rarityFill}
                  opacity={1}
                  letterSpacing={-0.2}
                  listening={false}
                />
              ) : null}
            </>
          ) : null}
          {preModernFooter.hasLangArtist && preModernFooter.langArtistY != null ? (
            <Text
              key={`pre-modern-footer-lang-artist-${metadataFill}`}
              text={preModernFooter.langArtistLine}
              x={preModernFooter.metaX}
              y={preModernFooter.langArtistY}
              width={preModernFooter.metaW}
              fontFamily={metadataStack}
              fontStyle={metadataFontStyle}
              fontSize={metadataFontSize}
              fill={metadataFill}
              align="center"
              opacity={1}
              letterSpacing={-0.2}
              listening={false}
            />
          ) : null}
          {preModernFooter.hasCopyright && preModernFooter.copyrightLineY != null ? (
            <Text
              key={`pre-modern-footer-copyright-${metadataFill}`}
              text={preModernFooter.copyrightLine}
              x={preModernFooter.metaX}
              y={preModernFooter.copyrightLineY}
              width={preModernFooter.metaW}
              fontFamily={metadataStack}
              fontStyle={metadataFontStyle}
              fontSize={metadataFontSize}
              fill={metadataFill}
              align="center"
              opacity={1}
              letterSpacing={-0.2}
              listening={false}
            />
          ) : null}
        </>
      ) : !supportsPreModernFooterLayout ? (
        <>
      <Text
        text={`${String(language || 'EN').toUpperCase()} • ${artist || ''}`.trim()}
        x={metadataLeftX}
        y={metadataBaseline2Eff - metadataFontSize + (pkmnCollectorLayout ? 0 : collectorDataYAdjust)}
        width={metadataTextW}
        fontFamily={metadataStack}
        fontStyle={metadataFontStyle}
        fontSize={metadataFontSize}
        fill={metadataFill}
        opacity={1}
        letterSpacing={-0.2}
        listening={false}
      />
      <Text
        text={resolveCardCopyright(copyright)}
        x={
          pkmnCollectorLayout
            ? metadataLeftX - PKMN_COPYRIGHT_LEFT_NUDGE_PX
            : metadataRightX - typeW
        }
        y={copyrightYEff - metadataFontSize + (pkmnCollectorLayout ? 0 : collectorDataYAdjust)}
        width={metadataTextW}
        fontFamily={metadataStack}
        fontStyle={metadataFontStyle}
        fontSize={metadataFontSize}
        fill={metadataFill}
        opacity={1}
        align="right"
        letterSpacing={-0.2}
        listening={false}
      />
        </>
      ) : null}
      {/* Module 3.7 – Authenticity & Security Mark */}
      {showHologram && supportsHologramSeal &&
        (() => {
          const canonical = normalizeRarity(rarity)
          const baseColor = RARITY_COLORS[canonical] ?? '#FFFFFF'
          const centerX = STAGE_WIDTH / 2
          const centerY = rulesInnerY + rulesInnerH + hologramYAdjust
          const outerRadiusX = 60
          const outerRadiusY = 35
          const innerRadiusX = outerRadiusX - 4
          const innerRadiusY = outerRadiusY - 4

          const highlightColor = (() => {
            const hex = baseColor.replace('#', '')
            if (hex.length !== 6) return '#FFFFFF'
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.35))
            return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`
          })()

          const shadowColor = (() => {
            const hex = baseColor.replace('#', '')
            if (hex.length !== 6) return baseColor
            const r = Math.round(parseInt(hex.slice(0, 2), 16) * 0.8)
            const g = Math.round(parseInt(hex.slice(2, 4), 16) * 0.8)
            const b = Math.round(parseInt(hex.slice(4, 6), 16) * 0.8)
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          })()

          return (
            <Group listening={false}>
              <Ellipse
                x={centerX}
                y={centerY}
                radiusX={outerRadiusX}
                radiusY={outerRadiusY}
                stroke={pinlineStroke}
                strokeWidth={2}
                fillLinearGradientStartPoint={{ x: -outerRadiusX, y: -outerRadiusY }}
                fillLinearGradientEndPoint={{ x: outerRadiusX, y: outerRadiusY }}
                fillLinearGradientColorStops={[0, '#F3F3F3', 1, '#B3B3B3']}
                listening={false}
              />
              <Ellipse
                x={centerX}
                y={centerY}
                radiusX={innerRadiusX}
                radiusY={innerRadiusY}
                stroke={pinlineInnerStroke}
                strokeWidth={1}
                fillLinearGradientStartPoint={{ x: -innerRadiusX, y: -innerRadiusY }}
                fillLinearGradientEndPoint={{ x: innerRadiusX, y: innerRadiusY }}
                fillLinearGradientColorStops={[0, highlightColor, 0.4, baseColor, 0.6, baseColor, 1, shadowColor]}
                listening={false}
              />
            </Group>
          )
        })()}
    </Layer>
  )
}

export default memo(TextIconsLayer)
