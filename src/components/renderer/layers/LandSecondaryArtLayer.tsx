import { memo, useEffect, useState } from 'react'
import { Group, Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { resolveLandPanelPublicUrl } from '../../../data/landPanelOptions'
import { useCardStore } from '../../../store/useCardStore'

/**
 * Land / Standard + Land / Borderless — fills the rules-text region with a bundled panel image.
 * Preview/export: same Konva stage stack as primary art; export uses full stage snapshot.
 */
function LandSecondaryArtLayer() {
  const { currentLayout, activeLayout, panelId } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      panelId: s.cardData.landSecondaryPanelId,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const supportsSecondaryArt = caps.supportsLandSecondaryArtInRulesRegion

  const url = supportsSecondaryArt ? resolveLandPanelPublicUrl(panelId) : null
  const rules = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  }).rulesText
  const rulesRect = layoutRegionToStageRect(rules)
  const rx = rulesRect.x
  const ry = rulesRect.y
  const rum = rulesRect.width
  const ruh = rulesRect.height

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

  if (!supportsSecondaryArt || !url || !img) return null

  const iw = img.naturalWidth || 1
  const ih = img.naturalHeight || 1
  const scale = Math.max(rum / iw, ruh / ih)
  const dw = iw * scale
  const dh = ih * scale
  const dx = rx + (rum - dw) / 2
  const dy = ry + (ruh - dh) / 2

  return (
    <Layer listening={false}>
      <Group clipX={rx} clipY={ry} clipWidth={rum} clipHeight={ruh} listening={false}>
        <Image image={img} x={dx} y={dy} width={dw} height={dh} listening={false} />
      </Group>
    </Layer>
  )
}

export default memo(LandSecondaryArtLayer)
