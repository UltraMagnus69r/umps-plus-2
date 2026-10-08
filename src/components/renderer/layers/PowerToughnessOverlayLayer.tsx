import { memo, useCallback, useMemo } from 'react'
import { Group, Layer, Shape, Text } from 'react-konva'
import type Konva from 'konva'
import { shallow } from 'zustand/shallow'
import {
  BEVEL_INSET,
  getProxyPtBoxDisplayRect,
  getStandardLayoutGeometry,
  reverseBezierPlatePathInLocalRect,
} from '../../../authority/geometryAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { useEffectiveTypographyFontKey } from '../../../hooks/useEffectiveTypographyFontKey'
import {
  resolveTypographyFontFace,
  resolveTypographyInkColor,
  typographyPtToStagePx,
  TYPO_PT_BOX_REF_PX,
} from '../../../authority/typographyAuthority'
import { type LayoutId } from '../../../authority/layoutTaxonomy'
import { landFullArtManaCircleKeyToBracketToken } from '../../../authority/landFullArtManaCircle'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import { createBoxPanelInnerFillStyle, resolveReadableInkOnBoxPanel } from '../../../authority/boxPanelFillAuthority'
import { usePanelBackgroundImage } from '../../../hooks/usePanelBackgroundImage'
import { effectivePanelBackground } from '../../../authority/panelBackgroundAuthority'
import { resolveEffectiveNameplateShape } from '../../../authority/nameplateShapeAuthority'
import { addFrameBoxPlateContourPath, FRAME_BOX_OUTER_STROKE_PX, type PlateContourPathOptions } from './frameBoxPath'
import { drawBeveledFrameOnContext } from './frameBevelDrawing'

const FRAME_SHADOW_BLUR_FEATHER = 4
const FRAME_SHADOW_OPACITY = 0.4
const FRAME_SHADOW_OFFSET = { x: 1, y: 1 }
const SECONDARY_STYLE_TEXT_FILL_LIGHT = '#fff'
const SECONDARY_STYLE_TEXT_FILL_DARK = '#111'
const SECONDARY_STYLE_STROKE_WIDTH = 2
const SECONDARY_STYLE_SHADOW_BLUR = 4

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
 * P/T box body + numeric text + outer pinline — rendered after SetSymbolLayer so nothing in the face stack covers it
 * (Rules Text Box Surface FX, watermark, land panel, rules text, set symbol all sit below).
 */
function PowerToughnessOverlayLayer() {
  const layout = getStandardLayoutGeometry()
  const {
    ptX,
    ptY,
    ptW,
    ptH,
    barRadius,
    ptInnerX,
    ptInnerY,
    ptInnerW,
    ptInnerH,
    artW,
    typeW,
    rulesX,
    rulesW,
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
    showPowerToughness,
    cardPower,
    cardToughness,
    secondaryNameLightText,
    ptTypography,
    currentLayout,
    activeLayout,
    landFullArtManaCircleKey,
    ptBoxColor,
    ptBoxGradientEnabled,
    ptBoxGradientDirection,
    ptBoxGradientSaturation,
    ptBoxGradientReversed,
    ptBarShape,
    bezierPlateEnabled,
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
      showPowerToughness: s.cardData.showPowerToughness,
      cardPower: s.cardData.power,
      cardToughness: s.cardData.toughness,
      secondaryNameLightText: s.cardData.secondaryNameLightText,
      ptTypography: s.cardData.ptTypography,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      landFullArtManaCircleKey: s.cardData.landFullArtManaCircleKey,
      ptBoxColor: s.cardData.ptBoxColor,
      ptBoxGradientEnabled: s.cardData.ptBoxGradientEnabled,
      ptBoxGradientDirection: s.cardData.ptBoxGradientDirection,
      ptBoxGradientSaturation: s.cardData.ptBoxGradientSaturation,
      ptBoxGradientReversed: s.cardData.ptBoxGradientReversed,
      ptBarShape: s.cardData.ptBarShape,
      bezierPlateEnabled: s.cardData.bezierPlateEnabled,
    }),
    shallow,
  )
  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const effectivePtBoxColor = useMemo(
    () => effectivePanelBackground('ptBoxColor', ptBoxColor, panelBackgroundPreview),
    [ptBoxColor, panelBackgroundPreview],
  )
  const ptBoxBgImage = usePanelBackgroundImage(effectivePtBoxColor)

  const ptInkOnPanel = useMemo(
    () =>
      resolveTypographyInkColor(
        ptTypography,
        resolveReadableInkOnBoxPanel(
          effectivePtBoxColor,
          undefined,
          ptBoxGradientEnabled,
          ptBoxGradientDirection,
          ptBoxGradientSaturation,
        ),
      ),
    [
      effectivePtBoxColor,
      ptTypography,
      ptBoxGradientEnabled,
      ptBoxGradientDirection,
      ptBoxGradientSaturation,
    ],
  )

  const { supportsPowerToughnessBox, supportsModernDummyLayout, supportsFloatingTextTreatment, useLandFullArtManaCircle } =
    getActiveLayoutCapabilitiesFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    })
  const standardFullArt = supportsFloatingTextTreatment
  const identityManaCost = useLandFullArtManaCircle
    ? landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey)
    : (manaCost ?? '')
  const identityPips = useLandFullArtManaCircle ? [] : colorIdentity
  const identityAutoColorEnabled = useLandFullArtManaCircle ? true : autoColorEnabled
  const showPowerToughnessEffective = showPowerToughness && supportsPowerToughnessBox

  const activeRegions = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const lowerRightRect = activeRegions.lowerRight ? layoutRegionToStageRect(activeRegions.lowerRight.rect) : null
  const effectivePtBarShape = resolveEffectiveNameplateShape(bezierPlateEnabled, ptBarShape)

  /** Shift P/T left when reverse Bezier: flat top/bottom right ends at rules box right edge. */
  const ptXEff = useMemo(() => {
    if (lowerRightRect || effectivePtBarShape !== 'reverseBezierPlate') return ptX
    const scaledArtW = (artW * ptW) / Math.max(1, typeW)
    return Math.round(rulesX + rulesW - scaledArtW)
  }, [lowerRightRect, effectivePtBarShape, ptX, artW, ptW, typeW, rulesX, rulesW])

  const ptInnerXEff =
    lowerRightRect?.x ??
    (effectivePtBarShape === 'reverseBezierPlate' && !lowerRightRect ? ptXEff + BEVEL_INSET : ptInnerX)
  const ptInnerYEff = lowerRightRect?.y ?? ptInnerY
  const ptInnerWEff = lowerRightRect?.width ?? ptInnerW
  const ptInnerHEff = lowerRightRect?.height ?? ptInnerH

  const useContractPtSlot = Boolean(supportsModernDummyLayout && lowerRightRect)
  const ptFrameX = useContractPtSlot ? lowerRightRect!.x - BEVEL_INSET : ptXEff
  const ptFrameY = useContractPtSlot ? lowerRightRect!.y - BEVEL_INSET : ptY
  const ptFrameW = useContractPtSlot ? lowerRightRect!.width + 2 * BEVEL_INSET : ptW
  const ptFrameH = useContractPtSlot ? lowerRightRect!.height + 2 * BEVEL_INSET : ptH

  /**
   * UMPS adjustment (doc 04, group B): the GENERATED proxy P/T capsule is drawn at
   * 70% scale, anchored at the canonical slot center, with a +5px X nudge while the
   * M15 painted frame is OFF. Applied as a uniform Group transform so every capsule
   * shape (incl. reverse-Bezier) scales identically. Full-art layouts keep their
   * own slot geometry and are unaffected. Skipped when a layout supplies its own
   * lowerRight region (e.g. land full-art) to avoid double-transforming it.
   */
  const proxyPtScale = useMemo(
    () =>
      getProxyPtBoxDisplayRect({ x: ptXEff, y: ptY, width: ptW, height: ptH }),
    [ptXEff, ptY, ptW, ptH],
  )
  const applyProxyPtScale = !supportsFloatingTextTreatment && !lowerRightRect

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

  const ptReversePlateSpan = useMemo(() => {
    if (effectivePtBarShape !== 'reverseBezierPlate') return undefined
    const scaledArtW = (artW * ptFrameW) / Math.max(1, typeW)
    const rulesRight = rulesX + rulesW
    return {
      boxLeftStage: ptFrameX,
      artColumnLeftStage: rulesRight - scaledArtW,
      artColumnWidthStage: scaledArtW,
    }
  }, [effectivePtBarShape, artW, ptFrameW, typeW, ptFrameX, rulesX, rulesW])

  const ptPinlineContourOpts: PlateContourPathOptions | undefined = useMemo(() => {
    if (effectivePtBarShape !== 'reverseBezierPlate' || !ptReversePlateSpan) return undefined
    const { pathX, pathW } = reverseBezierPlatePathInLocalRect(ptReversePlateSpan, 0, ptFrameW)
    return { reverseHorizontalSpan: { pathX, pathW } }
  }, [effectivePtBarShape, ptReversePlateSpan, ptFrameW])

  const ptCornerRadius = barRadius

  const drawPtBody = useCallback(
    (ctx: CanvasRenderingContext2D, _shape: Konva.Shape) => {
      const inner = createBoxPanelInnerFillStyle(
        ctx,
        ptFrameW,
        ptFrameH,
        effectivePtBoxColor,
        ptBoxGradientEnabled,
        ptBoxGradientDirection,
        ptBoxGradientSaturation,
        ptBoxGradientReversed,
        ptBoxBgImage,
      )
      drawBeveledFrameOnContext(ctx, ptFrameW, ptFrameH, ptCornerRadius, inner, 'raised', outerStrokeColor, bevelColors, {
        omitOuterStroke: true,
        shape: effectivePtBarShape,
        reversePlateSpan: ptReversePlateSpan,
      })
    },
    [
      ptFrameW,
      ptFrameH,
      ptCornerRadius,
      effectivePtBarShape,
      ptReversePlateSpan,
      effectivePtBoxColor,
      ptBoxGradientEnabled,
      ptBoxGradientDirection,
      ptBoxGradientSaturation,
      ptBoxGradientReversed,
      ptBoxBgImage,
      outerStrokeColor,
      bevelColors,
    ],
  )

  const effectivePtFontKey = useEffectiveTypographyFontKey('ptTypography', ptTypography.fontKey)

  const ptFace = useMemo(
    () => resolveTypographyFontFace(effectivePtFontKey, ptTypography.weight),
    [effectivePtFontKey, ptTypography.weight],
  )
  const ptStack = ptFace.fontStack
  const ptFontStyleKonva = ptFace.fontStyle
  const ptFill = ptInkOnPanel
  const secondaryStyleFill = secondaryNameLightText
    ? SECONDARY_STYLE_TEXT_FILL_LIGHT
    : SECONDARY_STYLE_TEXT_FILL_DARK
  const secondaryStyleStroke = secondaryNameLightText
    ? SECONDARY_STYLE_TEXT_FILL_DARK
    : SECONDARY_STYLE_TEXT_FILL_LIGHT
  const secondaryStyleShadow = secondaryNameLightText ? '#000' : '#fff'

  const floorToHalfPx = useCallback((v: number) => Math.floor(v * 2) / 2, [])
  const ptDisplayFontSize = useMemo(() => {
    const target = typographyPtToStagePx(ptTypography.sizePt, TYPO_PT_BOX_REF_PX)
    const heightCap = ptInnerHEff * 0.92
    return floorToHalfPx(Math.min(target, Math.max(28, heightCap)))
  }, [ptTypography.sizePt, ptInnerHEff, floorToHalfPx])
  const ptTextPadX = 6
  const ptTextPadY = 2

  if (!showPowerToughnessEffective) {
    return null
  }

  return (
    <Layer listening={false}>
      {showPowerToughnessEffective && !supportsFloatingTextTreatment && (
        <Group
          x={applyProxyPtScale ? proxyPtScale.centerX : 0}
          y={applyProxyPtScale ? proxyPtScale.centerY : 0}
          offsetX={applyProxyPtScale ? proxyPtScale.centerX : 0}
          offsetY={applyProxyPtScale ? proxyPtScale.centerY : 0}
          scaleX={applyProxyPtScale ? proxyPtScale.scale : 1}
          scaleY={applyProxyPtScale ? proxyPtScale.scale : 1}
          listening={false}
        >
          <Shape
            x={ptFrameX}
            y={ptFrameY}
            sceneFunc={(ctx, shape) => drawPtBody(ctx as unknown as CanvasRenderingContext2D, shape)}
            listening={false}
            shadowColor="#000"
            shadowBlur={FRAME_SHADOW_BLUR_FEATHER}
            shadowOffset={FRAME_SHADOW_OFFSET}
            shadowOpacity={FRAME_SHADOW_OPACITY}
          />
          <Text
            text={`${cardPower}/${cardToughness}`}
            x={ptInnerXEff + ptTextPadX}
            y={ptInnerYEff + ptTextPadY}
            width={ptInnerWEff - ptTextPadX * 2}
            height={ptInnerHEff - ptTextPadY * 2}
            fontFamily={ptStack}
            fontStyle={ptFontStyleKonva}
            fontSize={ptDisplayFontSize}
            fill={ptFill}
            verticalAlign="middle"
            align="center"
            listening={false}
          />
          <Shape
            x={ptFrameX}
            y={ptFrameY}
            sceneFunc={(ctx, _shape) => {
              const c = ctx as unknown as CanvasRenderingContext2D
              c.beginPath()
              addFrameBoxPlateContourPath(c, 0, 0, ptFrameW, ptFrameH, ptCornerRadius, effectivePtBarShape, false, ptPinlineContourOpts)
              c.strokeStyle = outerStrokeColor
              c.lineWidth = FRAME_BOX_OUTER_STROKE_PX
              c.stroke()
            }}
            listening={false}
          />
        </Group>
      )}
      {showPowerToughnessEffective && supportsFloatingTextTreatment && (
        <Text
          text={`${cardPower}/${cardToughness}`}
          x={ptInnerXEff + 6}
          y={ptInnerYEff + 2}
          width={ptInnerWEff - 12}
          height={ptInnerHEff - 4}
          fontFamily={ptStack}
          fontStyle={standardFullArt ? 'bold' : ptFontStyleKonva}
          fontSize={ptDisplayFontSize}
          fill={standardFullArt ? secondaryStyleFill : ptFill}
          stroke={standardFullArt ? secondaryStyleStroke : undefined}
          strokeWidth={standardFullArt ? SECONDARY_STYLE_STROKE_WIDTH : 0}
          shadowColor={standardFullArt ? secondaryStyleShadow : undefined}
          shadowBlur={standardFullArt ? SECONDARY_STYLE_SHADOW_BLUR : 0}
          shadowOffset={standardFullArt ? FRAME_SHADOW_OFFSET : undefined}
          verticalAlign="middle"
          align="center"
          listening={false}
        />
      )}
    </Layer>
  )
}

export default memo(PowerToughnessOverlayLayer)
