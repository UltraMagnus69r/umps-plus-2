import { memo, useMemo } from 'react'
import { Layer, Shape } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { BEVEL_INSET, getPreModernLayoutVerticalShiftPx, getStandardLayoutGeometry, M15_PAINTED_FRAME_ACTIVE } from '../../../authority/geometryAuthority'
import {
  getM15ProxyPanelShadowProps,
  proxyPanelsUseM15Style,
} from '../../../authority/m15ProxyPanelStyleAuthority'
import { isBorderlessArtTreatmentLayout, isPreModernLayout, isStandardModernBorderlessLayout } from '../../../authority/layoutTaxonomy'
import { landFullArtManaCircleKeyToBracketToken } from '../../../authority/landFullArtManaCircle'
import { buildModernDummyStageRects, getModernDummyTextBoxOuterRect } from '../../../authority/modernDummyLayoutAuthority'
import {
  getPlaneswalkerModernV2ArtOuterRect,
  getPlaneswalkerModernV2TextBoxOuterRect,
  getPlaneswalkerModernV2UnifiedChromeOuterRect,
  PW_MODERN_V2_ART_BOW_DEPTH_PX,
  PW_MODERN_V2_ART_FRAME_CORNER_RADIUS_PX,
  PW_MODERN_V2_UNIFIED_BORDER_CORNER_RADIUS_PX,
  PW_MODERN_V2_UNIFIED_BORDER_ENABLED,
  PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER,
  PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
  PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
  PW_MODERN_V2_RULES_BOX_CORNER_RADIUS_PX,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { resolveEffectiveNameplateShape } from '../../../authority/nameplateShapeAuthority'
import { getPreModernTextBoxOuterRect } from '../../../authority/preModernTextBoxAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { createBoxPanelInnerFillStyle } from '../../../authority/boxPanelFillAuthority'
import { usePanelBackgroundImage } from '../../../hooks/usePanelBackgroundImage'
import { effectivePanelBackground } from '../../../authority/panelBackgroundAuthority'
import { drawBeveledFrameOnContext } from './frameBevelDrawing'
import { FRAME_BOX_OUTER_STROKE_PX } from './frameBoxPath'
import { addPlaneswalkerModernV2RulesPanelPath } from './planeswalkerModernV2RulesPanelPath'

/** Module 2.2 — micro-shadow for printed edge (2–4 px). */
const FRAME_SHADOW_BLUR = 3
const FRAME_SHADOW_BLUR_FEATHER = 4
const FRAME_SHADOW_OPACITY = 0.4
const FRAME_SHADOW_OFFSET = { x: 1, y: 1 }

function darkenHex(hex: string, amount: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount))))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount))))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function lightenHex(hex: string, amount: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) + (255 - parseInt(n.slice(0, 2), 16)) * amount)))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) + (255 - parseInt(n.slice(2, 4), 16)) * amount)))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) + (255 - parseInt(n.slice(4, 6), 16)) * amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Layer 3 — Frame.
 * Name, art, type, rules. P/T chrome is in PowerToughnessOverlayLayer (z-index above Surface FX / text / set symbol).
 */
function FrameLayer() {
  const layout = getStandardLayoutGeometry()
  const {
    nameX,
    nameY,
    nameW,
    nameH,
    artX,
    artY,
    artW,
    artH,
    typeX,
    typeY,
    typeW,
    typeH,
    rulesX,
    rulesY,
    rulesW,
    rulesH,
    barRadius,
  } = layout

  const {
    cardTypeLine,
    colorIdentity,
    cardName,
    manaCost,
    autoColorEnabled,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
    landFullArtManaCircleKey,
    artImage,
    currentLayout,
    activeLayout,
    rulesTextBoxColor,
    nameBoxColor,
    typeLineBoxColor,
    nameBarShape,
    typeBarShape,
    bezierPlateEnabled,
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
  } = useCardStore(
    (s) => ({
      cardTypeLine: s.cardData.typeLine,
      colorIdentity: s.cardData.colorIdentity,
      cardName: s.cardData.name,
      manaCost: s.cardData.manaCost,
      autoColorEnabled: s.autoColorEnabled,
      manualColorKey: s.manualColorKey,
      manualColorHex1: s.manualColorHex1,
      manualColorHex2: s.manualColorHex2,
      manualColorHex3: s.manualColorHex3,
      manualColorHex4: s.manualColorHex4,
      manualColorHex5: s.manualColorHex5,
      manualColorCount: s.manualColorCount,
      landFullArtManaCircleKey: s.cardData.landFullArtManaCircleKey,
      artImage: s.cardData.artImage,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      rulesTextBoxColor: s.cardData.rulesTextBoxColor,
      nameBoxColor: s.cardData.nameBoxColor,
      typeLineBoxColor: s.cardData.typeLineBoxColor,
      nameBarShape: s.cardData.nameBarShape,
      typeBarShape: s.cardData.typeBarShape,
      bezierPlateEnabled: s.cardData.bezierPlateEnabled,
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
    }),
    shallow,
  )
  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const effectiveNameBoxColor = useMemo(
    () => effectivePanelBackground('nameBoxColor', nameBoxColor, panelBackgroundPreview),
    [nameBoxColor, panelBackgroundPreview],
  )
  const effectiveTypeLineBoxColor = useMemo(
    () => effectivePanelBackground('typeLineBoxColor', typeLineBoxColor, panelBackgroundPreview),
    [typeLineBoxColor, panelBackgroundPreview],
  )
  const effectiveRulesTextBoxColor = useMemo(
    () => effectivePanelBackground('rulesTextBoxColor', rulesTextBoxColor, panelBackgroundPreview),
    [rulesTextBoxColor, panelBackgroundPreview],
  )
  const nameBoxBgImage = usePanelBackgroundImage(effectiveNameBoxColor)
  const typeLineBoxBgImage = usePanelBackgroundImage(effectiveTypeLineBoxColor)
  const rulesBoxBgImage = usePanelBackgroundImage(effectiveRulesTextBoxColor)
  const {
    supportsRulesTextBoxTexture,
    supportsNamePlateBox,
    supportsTypeLineBox,
    supportsRulesTextBoxFrame,
    supportsPreModernFaceLayout,
    supportsPreModernTextBoxFrame,
    supportsModernDummyLayout,
    supportsPlaneswalkerModernV2Layout,
    useLandFullArtManaCircle,
    useAscendantLayout,
    useTarotLayout,
  } = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const borderlessLike = isBorderlessArtTreatmentLayout(activeLayout) || useAscendantLayout || useTarotLayout
  const preModernShiftY = isPreModernLayout(activeLayout) ? getPreModernLayoutVerticalShiftPx() : 0
  const nameYEff = nameY - preModernShiftY
  const artYEff = artY - preModernShiftY
  const typeYEff = typeY - preModernShiftY
  const rulesYEff = rulesY - preModernShiftY
  const identityManaCost = useLandFullArtManaCircle
    ? landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey)
    : (manaCost ?? '')
  const identityPips = useLandFullArtManaCircle ? [] : colorIdentity
  const identityAutoColorEnabled = useLandFullArtManaCircle ? true : autoColorEnabled

  const landFullArtNameOuter = useMemo(() => {
    if (!useLandFullArtManaCircle) return null
    const inner = layoutRegionToStageRect(
      getActiveLayoutRegionsFromState({ currentLayout, cardData: { layout: activeLayout } }).nameBar,
    )
    return {
      x: inner.x - BEVEL_INSET,
      y: inner.y - BEVEL_INSET,
      w: inner.width + 2 * BEVEL_INSET,
      h: inner.height + 2 * BEVEL_INSET,
    }
  }, [useLandFullArtManaCircle, currentLayout, activeLayout])

  const contractRegions = getActiveLayoutRegionsFromState({ currentLayout, cardData: { layout: activeLayout } })

  const plateOuterFromInner = useMemo(
    () => (inner: { x: number; y: number; width: number; height: number }) => ({
      x: inner.x - BEVEL_INSET,
      y: inner.y - BEVEL_INSET,
      w: inner.width + 2 * BEVEL_INSET,
      h: inner.height + 2 * BEVEL_INSET,
    }),
    [],
  )

  const contractNamePlate = useMemo(() => {
    if (!supportsModernDummyLayout) return null
    return plateOuterFromInner(layoutRegionToStageRect(contractRegions.nameBar))
  }, [supportsModernDummyLayout, contractRegions.nameBar, plateOuterFromInner])

  const contractTypePlate = useMemo(() => {
    if (!supportsModernDummyLayout) return null
    return plateOuterFromInner(layoutRegionToStageRect(contractRegions.typeLine))
  }, [supportsModernDummyLayout, contractRegions.typeLine, plateOuterFromInner])

  const contractArtFrame = useMemo(() => {
    if (!supportsModernDummyLayout && !supportsPreModernFaceLayout && !useAscendantLayout && !useTarotLayout) return null
    if (useAscendantLayout || useTarotLayout) {
      const inner = layoutRegionToStageRect(contractRegions.art)
      return {
        x: inner.x,
        y: inner.y,
        width: inner.width,
        height: inner.height,
      }
    }
    const inner = isStandardModernBorderlessLayout(activeLayout)
      ? buildModernDummyStageRects().art
      : layoutRegionToStageRect(contractRegions.art)
    return {
      x: inner.x - BEVEL_INSET,
      y: inner.y - BEVEL_INSET,
      width: inner.width + 2 * BEVEL_INSET,
      height: inner.height + 2 * BEVEL_INSET,
    }
  }, [supportsModernDummyLayout, supportsPreModernFaceLayout, useAscendantLayout, useTarotLayout, contractRegions.art, activeLayout])

  const modernV2ArtOuter = useMemo(() => {
    if (!supportsPlaneswalkerModernV2Layout) return null
    return getPlaneswalkerModernV2ArtOuterRect()
  }, [supportsPlaneswalkerModernV2Layout])

  const artFrameX = modernV2ArtOuter?.x ?? contractArtFrame?.x ?? artX
  const artFrameY = contractArtFrame?.y ?? artYEff
  const artFrameW = modernV2ArtOuter?.width ?? contractArtFrame?.width ?? artW
  const artFrameH = contractArtFrame?.height ?? artH
  const artFrameOuterStrokePx =
    supportsPreModernFaceLayout || supportsModernDummyLayout
      ? FRAME_BOX_OUTER_STROKE_PX * 2
      : FRAME_BOX_OUTER_STROKE_PX

  const nameOuterX = contractNamePlate?.x ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.x : nameX)
  const nameOuterY = contractNamePlate?.y ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.y : nameYEff)
  const nameOuterW = contractNamePlate?.w ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.w : nameW)
  const nameOuterH = contractNamePlate?.h ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.h : nameH)

  const typeOuterX = contractTypePlate?.x ?? typeX
  const typeOuterY = contractTypePlate?.y ?? typeYEff
  const typeOuterW = contractTypePlate?.w ?? typeW
  const typeOuterH = contractTypePlate?.h ?? typeH

  const preModernTextBoxFrame = useMemo(() => {
    if (!supportsPreModernTextBoxFrame) return null
    if (supportsPlaneswalkerModernV2Layout) return getPlaneswalkerModernV2TextBoxOuterRect()
    return supportsModernDummyLayout ? getModernDummyTextBoxOuterRect() : getPreModernTextBoxOuterRect()
  }, [supportsPreModernTextBoxFrame, supportsModernDummyLayout, supportsPlaneswalkerModernV2Layout])

  const plateBarRadius = supportsPlaneswalkerModernV2Layout
    ? Math.round(barRadius * PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER)
    : barRadius
  const effectiveNameBarShape = resolveEffectiveNameplateShape(bezierPlateEnabled, nameBarShape)
  const effectiveTypeBarShape = resolveEffectiveNameplateShape(bezierPlateEnabled, typeBarShape)
  const rulesBoxCornerRadius = supportsPlaneswalkerModernV2Layout ? PW_MODERN_V2_RULES_BOX_CORNER_RADIUS_PX : 0

  const modernV2RulesOuter = useMemo(() => {
    if (!supportsPlaneswalkerModernV2Layout) return null
    return getPlaneswalkerModernV2TextBoxOuterRect()
  }, [supportsPlaneswalkerModernV2Layout])

  const modernV2UnifiedChrome = useMemo(() => {
    if (!supportsPlaneswalkerModernV2Layout) return null
    return getPlaneswalkerModernV2UnifiedChromeOuterRect()
  }, [supportsPlaneswalkerModernV2Layout])

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
      useLandFullArtManaCircle,
      landFullArtManaCircleKey,
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
    ],
  )

  const identityStroke = resolvedIdentity.stroke
  const outerStrokeColor = useMemo(() => darkenHex(identityStroke, 0.4), [identityStroke])
  const raisedBevelLight = useMemo(() => lightenHex(identityStroke, 0.78), [identityStroke])
  const raisedBevelDark = useMemo(() => darkenHex(identityStroke, 0.18), [identityStroke])
  const recessedBevelLight = useMemo(() => lightenHex(identityStroke, 0.55), [identityStroke])
  const recessedBevelDark = useMemo(() => darkenHex(identityStroke, 0.25), [identityStroke])

  const bevelColors = useMemo(
    () => ({
      raisedBevelLight,
      raisedBevelDark,
      recessedBevelLight,
      recessedBevelDark,
    }),
    [raisedBevelLight, raisedBevelDark, recessedBevelLight, recessedBevelDark],
  )

  const nameReversePlateSpan = useMemo(
    () =>
      effectiveNameBarShape === 'reverseBezierPlate'
        ? {
            boxLeftStage: nameOuterX,
            artColumnLeftStage: supportsPlaneswalkerModernV2Layout
              ? (modernV2ArtOuter?.x ?? artX)
              : supportsModernDummyLayout
                ? artFrameX
                : artX,
            artColumnWidthStage: supportsPlaneswalkerModernV2Layout
              ? (modernV2ArtOuter?.width ?? artW)
              : supportsModernDummyLayout
                ? artFrameW
                : artW,
          }
        : undefined,
    [effectiveNameBarShape, nameOuterX, supportsPlaneswalkerModernV2Layout, supportsModernDummyLayout, modernV2ArtOuter, artFrameX, artFrameW, artX, artW],
  )

  const typeReversePlateSpan = useMemo(
    () =>
      effectiveTypeBarShape === 'reverseBezierPlate'
        ? {
            boxLeftStage: typeOuterX,
            artColumnLeftStage: supportsPlaneswalkerModernV2Layout
              ? (modernV2ArtOuter?.x ?? artX)
              : supportsModernDummyLayout
                ? artFrameX
                : artX,
            artColumnWidthStage: supportsPlaneswalkerModernV2Layout
              ? (modernV2ArtOuter?.width ?? artW)
              : supportsModernDummyLayout
                ? artFrameW
                : artW,
          }
        : undefined,
    [effectiveTypeBarShape, typeOuterX, supportsPlaneswalkerModernV2Layout, supportsModernDummyLayout, modernV2ArtOuter, artFrameX, artFrameW, artX, artW],
  )

  /**
   * UMPS adjustment (doc 04, group G): generated Name Plate / Type Line Bar panels
   * use the M15-style drop shadow while the M15 painted frame is OFF (the default
   * proxy look). Falls back to the plain micro-shadow when the M15 frame is active.
   */
  const useM15PanelStyle = proxyPanelsUseM15Style(M15_PAINTED_FRAME_ACTIVE)
  const namePanelShadow = useM15PanelStyle
    ? getM15ProxyPanelShadowProps()
    : {
        shadowColor: '#000',
        shadowBlur: FRAME_SHADOW_BLUR_FEATHER,
        shadowOffset: FRAME_SHADOW_OFFSET,
        shadowOpacity: FRAME_SHADOW_OPACITY,
      }
  const typePanelShadow = useM15PanelStyle
    ? getM15ProxyPanelShadowProps()
    : {
        shadowColor: '#000',
        shadowBlur: FRAME_SHADOW_BLUR,
        shadowOffset: FRAME_SHADOW_OFFSET,
        shadowOpacity: FRAME_SHADOW_OPACITY,
      }

  return (
    <Layer listening={false}>
      {supportsNamePlateBox && (
        <Shape
          x={nameOuterX}
          y={nameOuterY}
          sceneFunc={(ctx, _shape) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const inner = createBoxPanelInnerFillStyle(
              c,
              nameOuterW,
              nameOuterH,
              effectiveNameBoxColor,
              nameBoxGradientEnabled,
              nameBoxGradientDirection,
              nameBoxGradientSaturation,
              nameBoxGradientReversed,
              nameBoxBgImage,
            )
            drawBeveledFrameOnContext(c, nameOuterW, nameOuterH, plateBarRadius, inner, 'raised', outerStrokeColor, bevelColors, {
              shape: effectiveNameBarShape,
              reversePlateSpan: nameReversePlateSpan,
              fillOnly: supportsPlaneswalkerModernV2Layout,
            })
          }}
          listening={false}
          {...namePanelShadow}
        />
      )}
      {!borderlessLike && (
        <Shape
          x={artFrameX}
          y={artFrameY}
          sceneFunc={(ctx, _shape) =>
            drawBeveledFrameOnContext(
              ctx as unknown as CanvasRenderingContext2D,
              artFrameW,
              artFrameH,
              supportsPlaneswalkerModernV2Layout ? PW_MODERN_V2_ART_FRAME_CORNER_RADIUS_PX : 0,
              artImage ? 'transparent' : '#bfbfbf',
              'recessed',
              outerStrokeColor,
              bevelColors,
              {
                outerStrokeWidthPx: artFrameOuterStrokePx,
                fillOnly: supportsPlaneswalkerModernV2Layout,
                bowedHorizontal: supportsPlaneswalkerModernV2Layout
                  ? {
                      cornerR: PW_MODERN_V2_ART_FRAME_CORNER_RADIUS_PX,
                      bowDepth: PW_MODERN_V2_ART_BOW_DEPTH_PX,
                      bowVertical: true,
                    }
                  : undefined,
              },
            )
          }
          listening={false}
        />
      )}
      {supportsTypeLineBox && (
        <Shape
          x={typeOuterX}
          y={typeOuterY}
          sceneFunc={(ctx, _shape) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const inner = createBoxPanelInnerFillStyle(
              c,
              typeOuterW,
              typeOuterH,
              effectiveTypeLineBoxColor,
              typeLineBoxGradientEnabled,
              typeLineBoxGradientDirection,
              typeLineBoxGradientSaturation,
              typeLineBoxGradientReversed,
              typeLineBoxBgImage,
            )
            drawBeveledFrameOnContext(c, typeOuterW, typeOuterH, plateBarRadius, inner, 'raised', outerStrokeColor, bevelColors, {
              shape: effectiveTypeBarShape,
              reversePlateSpan: typeReversePlateSpan,
              fillOnly: supportsPlaneswalkerModernV2Layout,
            })
          }}
          listening={false}
          {...typePanelShadow}
        />
      )}
      {supportsRulesTextBoxFrame && (
        <Shape
          x={rulesX}
          y={rulesYEff}
          sceneFunc={(ctx, _shape) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const inner = supportsRulesTextBoxTexture
              ? 'rgba(0,0,0,0)'
              : createBoxPanelInnerFillStyle(
                  c,
                  rulesW,
                  rulesH,
                  effectiveRulesTextBoxColor,
                  rulesTextBoxGradientEnabled,
                  rulesTextBoxGradientDirection,
                  rulesTextBoxGradientSaturation,
                  rulesTextBoxGradientReversed,
                  rulesBoxBgImage,
                )
            drawBeveledFrameOnContext(c, rulesW, rulesH, 0, inner, 'recessed', outerStrokeColor, bevelColors)
          }}
          listening={false}
        />
      )}
      {modernV2RulesOuter ? (
        <Shape
          x={modernV2RulesOuter.x}
          y={modernV2RulesOuter.y}
          sceneFunc={(ctx, _shape) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const panelW = modernV2RulesOuter.width - 2 * BEVEL_INSET
            const panelH = modernV2RulesOuter.height - 2 * BEVEL_INSET
            const inner = supportsRulesTextBoxTexture
              ? 'rgba(0,0,0,0)'
              : createBoxPanelInnerFillStyle(
                  c,
                  panelW,
                  panelH,
                  effectiveRulesTextBoxColor,
                  rulesTextBoxGradientEnabled,
                  rulesTextBoxGradientDirection,
                  rulesTextBoxGradientSaturation,
                  rulesTextBoxGradientReversed,
                  rulesBoxBgImage,
                )
            c.beginPath()
            addPlaneswalkerModernV2RulesPanelPath(
              c,
              BEVEL_INSET,
              BEVEL_INSET,
              panelW,
              panelH,
              PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
              false,
              PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
            )
            c.fillStyle = inner
            c.fill()
          }}
          listening={false}
        />
      ) : null}
      {preModernTextBoxFrame && !supportsPlaneswalkerModernV2Layout ? (
        <Shape
          x={preModernTextBoxFrame.x}
          y={preModernTextBoxFrame.y}
          sceneFunc={(ctx, _shape) =>
            drawBeveledFrameOnContext(
              ctx as unknown as CanvasRenderingContext2D,
              preModernTextBoxFrame.width,
              preModernTextBoxFrame.height,
              rulesBoxCornerRadius,
              'rgba(0,0,0,0)',
              'recessed',
              outerStrokeColor,
              bevelColors,
              { outerStrokeWidthPx: FRAME_BOX_OUTER_STROKE_PX * 2 },
            )
          }
          listening={false}
        />
      ) : null}
      {modernV2UnifiedChrome && PW_MODERN_V2_UNIFIED_BORDER_ENABLED ? (
        <Shape
          x={modernV2UnifiedChrome.x}
          y={modernV2UnifiedChrome.y}
          sceneFunc={(ctx, _shape) =>
            drawBeveledFrameOnContext(
              ctx as unknown as CanvasRenderingContext2D,
              modernV2UnifiedChrome.width,
              modernV2UnifiedChrome.height,
              PW_MODERN_V2_UNIFIED_BORDER_CORNER_RADIUS_PX,
              'rgba(0,0,0,0)',
              'recessed',
              outerStrokeColor,
              bevelColors,
              { outerStrokeWidthPx: FRAME_BOX_OUTER_STROKE_PX * 2 },
            )
          }
          listening={false}
        />
      ) : null}
    </Layer>
  )
}

export default memo(FrameLayer)
