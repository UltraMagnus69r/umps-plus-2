import { memo, useEffect, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { getWatermarkAssetUrl } from '../../../authority/watermarkAuthority'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'

/**
 * Module 5.2 — rules-text-area watermark (local assets, store opacity).
 * Composed above frame fill, below TextIconsLayer text.
 */
function WatermarkLayer() {
  const { watermarkPath, watermarkOpacity, customWatermarkDataUrl, currentLayout, activeLayout } = useCardStore(
    (s) => ({
      watermarkPath: s.cardData.watermarkPath,
      watermarkOpacity: s.cardData.watermarkOpacity,
      customWatermarkDataUrl: s.cardData.customWatermarkDataUrl,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
    }),
    shallow,
  )

  const assetUrl = watermarkPath === 'custom' ? customWatermarkDataUrl || null : getWatermarkAssetUrl(watermarkPath)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!assetUrl) {
      setImgEl(null)
      return
    }
    const im = new window.Image()
    im.onload = () => setImgEl(im)
    im.onerror = () => setImgEl(null)
    im.src = assetUrl
    return () => {
      setImgEl(null)
    }
  }, [assetUrl])

  if (!assetUrl || !imgEl) return null

  const rulesRect = layoutRegionToStageRect(
    getActiveLayoutRegionsFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    }).rulesText,
  )
  const cx = rulesRect.x + rulesRect.width / 2
  const cy = rulesRect.y + rulesRect.height / 2
  const diameter = Math.min(rulesRect.width, rulesRect.height) * 0.84
  const nw = imgEl.naturalWidth || 1
  const nh = imgEl.naturalHeight || 1
  const scale = Math.min(diameter / nw, diameter / nh)
  const w = nw * scale
  const h = nh * scale

  return (
    <Layer listening={false} opacity={watermarkOpacity}>
      <Image
        image={imgEl}
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        listening={false}
        imageSmoothingEnabled={true}
      />
    </Layer>
  )
}

export default memo(WatermarkLayer)
