import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Image, Layer, Rect, Shape } from 'react-konva'
import Konva from 'konva'
import { shallow } from 'zustand/shallow'
import { BEVEL_INSET } from '../../../authority/geometryAuthority'
import { getKonvaBoxPanelRectProps } from '../../../authority/boxPanelFillAuthority'
import { getActiveLayoutCapabilitiesFromState, getActiveLayoutRegionsFromState, layoutRegionToStageRect } from '../../../authority/layoutRegistry'
import {
  getPlaneswalkerModernV2TextBoxInnerRect,
  getPlaneswalkerModernV2TextBoxOuterRect,
  PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
  PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { usePanelBackgroundImage } from '../../../hooks/usePanelBackgroundImage'
import { useCardStore } from '../../../store/useCardStore'
import {
  createCoverImagePatternForBowedRulesPanel,
  fillPlaneswalkerModernV2RulesPanel,
} from './planeswalkerModernV2RulesPanelPath'

const RULES_TEXTURE_NOISE_AMOUNT = 0.08

/**
 * Surface FX — rules panel texture overlay (opacity). Base fill lives in FrameLayer.
 * Modern V2: bowed clip matches the rules panel silhouette; FrameLayer owns the base color.
 */
function RulesTextBoxTextureLayer() {
  const {
    currentLayout,
    activeLayout,
    rulesTextBoxTexture,
    rulesTextBoxTextureOpacity,
    rulesTextBoxColor,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
    rulesTextBoxGradientReversed,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      rulesTextBoxTexture: s.cardData.rulesTextBoxTexture,
      rulesTextBoxTextureOpacity: s.cardData.rulesTextBoxTextureOpacity,
      rulesTextBoxColor: s.cardData.rulesTextBoxColor,
      rulesTextBoxGradientEnabled: s.cardData.rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection: s.cardData.rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation: s.cardData.rulesTextBoxGradientSaturation,
      rulesTextBoxGradientReversed: s.cardData.rulesTextBoxGradientReversed,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const modernV2Layout = caps.supportsPlaneswalkerModernV2Layout
  const surfaceAllowed =
    modernV2Layout || (caps.supportsRulesTextBoxTexture && !caps.supportsPreModernTextBoxFrame)
  const file = typeof rulesTextBoxTexture === 'string' ? rulesTextBoxTexture.trim() : ''
  const shouldLoadTexture = surfaceAllowed && file.length > 0

  const rulesRect = useMemo(() => {
    if (modernV2Layout) return getPlaneswalkerModernV2TextBoxInnerRect()
    return layoutRegionToStageRect(
      getActiveLayoutRegionsFromState({
        currentLayout,
        cardData: { layout: activeLayout },
      }).rulesText,
    )
  }, [modernV2Layout, currentLayout, activeLayout])

  const modernV2Panel = useMemo(() => {
    if (!modernV2Layout) return null
    const outer = getPlaneswalkerModernV2TextBoxOuterRect()
    return {
      x: outer.x,
      y: outer.y,
      panelW: outer.width - 2 * BEVEL_INSET,
      panelH: outer.height - 2 * BEVEL_INSET,
      bowDepth: PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
      bottomCornerR: PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
    }
  }, [modernV2Layout])

  const rulesBoxBgImage = usePanelBackgroundImage(rulesTextBoxColor)

  const [textureImg, setTextureImg] = useState<HTMLImageElement | null>(null)
  const textureGroupRef = useRef<Konva.Group>(null)

  useEffect(() => {
    if (!shouldLoadTexture) {
      setTextureImg(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setTextureImg(img)
    img.onerror = () => setTextureImg(null)
    img.src = `/assets/textures/${encodeURIComponent(file)}`
    return () => {
      setTextureImg(null)
    }
  }, [shouldLoadTexture, file])

  useEffect(() => {
    if (textureImg && !modernV2Layout) textureGroupRef.current?.cache()
  }, [
    textureImg,
    rulesTextBoxTextureOpacity,
    rulesRect.width,
    rulesRect.height,
    rulesTextBoxColor,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
    rulesTextBoxGradientReversed,
    modernV2Layout,
  ])

  const rw = rulesRect.width
  const rh = rulesRect.height
  const textureOpacity = Math.max(0, Math.min(1, rulesTextBoxTextureOpacity ?? 1))

  const rulesBaseFillProps = useMemo(
    () =>
      getKonvaBoxPanelRectProps(
        rw,
        rh,
        rulesTextBoxColor,
        rulesTextBoxGradientEnabled,
        rulesTextBoxGradientDirection,
        rulesTextBoxGradientSaturation,
        rulesTextBoxGradientReversed,
        rulesBoxBgImage,
      ),
    [
      rw,
      rh,
      rulesTextBoxColor,
      rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation,
      rulesTextBoxGradientReversed,
      rulesBoxBgImage,
    ],
  )

  if (!surfaceAllowed) {
    return null
  }

  let textureCover: { dx: number; dy: number; dw: number; dh: number } | null = null
  if (textureImg) {
    const iw = textureImg.naturalWidth || 1
    const ih = textureImg.naturalHeight || 1
    const scale = Math.max(rw / iw, rh / ih)
    const dw = iw * scale
    const dh = ih * scale
    textureCover = { dx: (rw - dw) / 2, dy: (rh - dh) / 2, dw, dh }
  }

  if (modernV2Layout) {
    if (!textureImg || !modernV2Panel) return null
    const { x, y, panelW, panelH, bowDepth, bottomCornerR } = modernV2Panel
    return (
      <Layer listening={false}>
        <Shape
          x={x}
          y={y}
          opacity={textureOpacity}
          listening={false}
          sceneFunc={(ctx, _shape) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const pattern = createCoverImagePatternForBowedRulesPanel(
              c,
              textureImg,
              panelW,
              panelH,
              bowDepth,
            )
            if (!pattern) return
            fillPlaneswalkerModernV2RulesPanel(
              c,
              BEVEL_INSET,
              BEVEL_INSET,
              panelW,
              panelH,
              bowDepth,
              pattern,
              bottomCornerR,
            )
          }}
        />
      </Layer>
    )
  }

  return (
    <Layer listening={false}>
      <Group x={rulesRect.x} y={rulesRect.y} clipX={0} clipY={0} clipWidth={rw} clipHeight={rh} listening={false}>
        <Rect x={0} y={0} width={rw} height={rh} {...rulesBaseFillProps} listening={false} />
        {textureImg && textureCover ? (
          <Group
            ref={textureGroupRef}
            listening={false}
            filters={[Konva.Filters.Noise]}
            noise={RULES_TEXTURE_NOISE_AMOUNT}
          >
            <Image
              image={textureImg}
              x={textureCover.dx}
              y={textureCover.dy}
              width={textureCover.dw}
              height={textureCover.dh}
              opacity={textureOpacity}
              listening={false}
            />
          </Group>
        ) : null}
      </Group>
    </Layer>
  )
}

export default memo(RulesTextBoxTextureLayer)
