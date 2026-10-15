import { memo, useEffect, useMemo, useState } from 'react'
import { Image, Layer, Shape } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { BEVEL_INSET } from '../../../authority/geometryAuthority'
import { getModernDummyTextBoxInnerRect } from '../../../authority/modernDummyLayoutAuthority'
import { getPreModernTextBoxInnerRect } from '../../../authority/preModernTextBoxAuthority'
import {
  getPlaneswalkerModernV2TextBoxOuterRect,
  PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
  PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { resolvePreModernRulesTextBoxPublicUrl } from '../../../data/preModernRulesTextBoxOptions'
import { useCardStore } from '../../../store/useCardStore'
import {
  createImagePatternForBowedRulesPanel,
  fillPlaneswalkerModernV2RulesPanel,
} from './planeswalkerModernV2RulesPanelPath'

/**
 * Standard / Land / Planeswalker — bundled rules text box background inside the recessed frame.
 * Modern V2 fills the bowed rules panel silhouette (flat top/sides, bowed bottom).
 */
function PreModernRulesTextBoxLayer() {
  const { currentLayout, activeLayout, panelId } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      panelId: s.cardData.preModernRulesTextBoxId,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })

  const modernV2Layout = caps.supportsPlaneswalkerModernV2Layout
  const showBundledRulesPanel = caps.supportsPreModernTextBoxFrame || modernV2Layout
  const url = showBundledRulesPanel ? resolvePreModernRulesTextBoxPublicUrl(panelId) : null

  const innerRect = useMemo(() => {
    if (!showBundledRulesPanel) return null
    if (modernV2Layout) return null
    return caps.supportsModernDummyLayout ? getModernDummyTextBoxInnerRect() : getPreModernTextBoxInnerRect()
  }, [showBundledRulesPanel, modernV2Layout, caps.supportsModernDummyLayout])

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

  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!url) {
      setImg(null)
      return
    }
    const im = new window.Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => setImg(im)
    im.onerror = () => setImg(null)
    im.src = url
    return () => {
      setImg(null)
    }
  }, [url])

  if (!showBundledRulesPanel || !url || !img) return null

  if (modernV2Panel) {
    const { x, y, panelW, panelH, bowDepth, bottomCornerR } = modernV2Panel
    return (
      <Layer listening={false}>
        <Shape
          x={x}
          y={y}
          listening={false}
          sceneFunc={(ctx, _shape) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const pattern = createImagePatternForBowedRulesPanel(c, img, panelW, panelH, bowDepth)
            fillPlaneswalkerModernV2RulesPanel(
              c,
              BEVEL_INSET,
              BEVEL_INSET,
              panelW,
              panelH,
              bowDepth,
              pattern ?? '#f2ebe0',
              bottomCornerR,
            )
          }}
        />
      </Layer>
    )
  }

  if (!innerRect) return null

  return (
    <Layer listening={false}>
      <Image
        image={img}
        x={innerRect.x}
        y={innerRect.y}
        width={innerRect.width}
        height={innerRect.height}
        listening={false}
      />
    </Layer>
  )
}

export default memo(PreModernRulesTextBoxLayer)
