import { memo, useMemo } from 'react'
import { Layer, Shape } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  BEVEL_INSET,
  getPreModernLayoutVerticalShiftPx,
  getStandardLayoutGeometry,
  M15_PAINTED_FRAME_ACTIVE,
} from '../../../authority/geometryAuthority'
import {
  getM15ProxyPanelShadowProps,
  proxyPanelsUseM15Style,
} from '../../../authority/m15ProxyPanelStyleAuthority'
import { isPreModernLayout } from '../../../authority/layoutTaxonomy'
import { landFullArtManaCircleKeyToBracketToken } from '../../../authority/landFullArtManaCircle'
import { buildModernDummyStageRects } from '../../../authority/modernDummyLayoutAuthority'
import {
  getPlaneswalkerModernV2ArtOuterRect,
  PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { resolveEffectiveNameplateShape } from '../../../authority/nameplateShapeAuthority'
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

/** Module 2.2 — micro-shadow for printed edge (matches FrameLayer name plate). */
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
 * Raised name plate chrome — drawn above CrownLayer so Showcase crowns sit behind the bar
 * and above art / inner border / art-frame bevel (FrameLayer).
 */
function NamePlateLayer() {
  const layout = getStandardLayoutGeometry()
  const { nameX, nameY, nameW, nameH, artX, artW, barRadius } = layout

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
    currentLayout,
    activeLayout,
    nameBoxColor,
    nameBarShape,
    bezierPlateEnabled,
    nameBoxGradientEnabled,
    nameBoxGradientDirection,
    nameBoxGradientSaturation,
    nameBoxGradientReversed,
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
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      nameBoxColor: s.cardData.nameBoxColor,
      nameBarShape: s.cardData.nameBarShape,
      bezierPlateEnabled: s.cardData.bezierPlateEnabled,
      nameBoxGradientEnabled: s.cardData.nameBoxGradientEnabled,
      nameBoxGradientDirection: s.cardData.nameBoxGradientDirection,
      nameBoxGradientSaturation: s.cardData.nameBoxGradientSaturation,
      nameBoxGradientReversed: s.cardData.nameBoxGradientReversed,
    }),
    shallow,
  )

  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const effectiveNameBoxColor = useMemo(
    () => effectivePanelBackground('nameBoxColor', nameBoxColor, panelBackgroundPreview),
    [nameBoxColor, panelBackgroundPreview],
  )
  const nameBoxBgImage = usePanelBackgroundImage(effectiveNameBoxColor)

  const {
    supportsNamePlateBox,
    supportsModernDummyLayout,
    supportsPlaneswalkerModernV2Layout,
    useLandFullArtManaCircle,
  } = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })

  const preModernShiftY = isPreModernLayout(activeLayout) ? getPreModernLayoutVerticalShiftPx() : 0
  const nameYEff = nameY - preModernShiftY
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

  const contractRegions = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })

  const contractNamePlate = useMemo(() => {
    if (!supportsModernDummyLayout) return null
    const inner = layoutRegionToStageRect(contractRegions.nameBar)
    return {
      x: inner.x - BEVEL_INSET,
      y: inner.y - BEVEL_INSET,
      w: inner.width + 2 * BEVEL_INSET,
      h: inner.height + 2 * BEVEL_INSET,
    }
  }, [supportsModernDummyLayout, contractRegions.nameBar])

  const modernV2ArtOuter = useMemo(() => {
    if (!supportsPlaneswalkerModernV2Layout) return null
    return getPlaneswalkerModernV2ArtOuterRect()
  }, [supportsPlaneswalkerModernV2Layout])

  const modernDummyArt = useMemo(() => {
    if (!supportsModernDummyLayout) return null
    return buildModernDummyStageRects().art
  }, [supportsModernDummyLayout])

  const artFrameX = modernV2ArtOuter?.x ?? (modernDummyArt ? modernDummyArt.x - BEVEL_INSET : artX)
  const artFrameW =
    modernV2ArtOuter?.width ?? (modernDummyArt ? modernDummyArt.width + 2 * BEVEL_INSET : artW)

  const nameOuterX =
    contractNamePlate?.x ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.x : nameX)
  const nameOuterY =
    contractNamePlate?.y ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.y : nameYEff)
  const nameOuterW =
    contractNamePlate?.w ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.w : nameW)
  const nameOuterH =
    contractNamePlate?.h ?? (useLandFullArtManaCircle && landFullArtNameOuter ? landFullArtNameOuter.h : nameH)

  const plateBarRadius = supportsPlaneswalkerModernV2Layout
    ? Math.round(barRadius * PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER)
    : barRadius
  const effectiveNameBarShape = resolveEffectiveNameplateShape(bezierPlateEnabled, nameBarShape)

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
    [
      effectiveNameBarShape,
      nameOuterX,
      supportsPlaneswalkerModernV2Layout,
      supportsModernDummyLayout,
      modernV2ArtOuter,
      artFrameX,
      artFrameW,
      artX,
      artW,
    ],
  )

  const useM15PanelStyle = proxyPanelsUseM15Style(M15_PAINTED_FRAME_ACTIVE)
  const namePanelShadow = useM15PanelStyle
    ? getM15ProxyPanelShadowProps()
    : {
        shadowColor: '#000',
        shadowBlur: FRAME_SHADOW_BLUR_FEATHER,
        shadowOffset: FRAME_SHADOW_OFFSET,
        shadowOpacity: FRAME_SHADOW_OPACITY,
      }

  if (!supportsNamePlateBox) return null

  return (
    <Layer listening={false}>
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
    </Layer>
  )
}

export default memo(NamePlateLayer)
